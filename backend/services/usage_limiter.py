from datetime import datetime, timedelta, timezone

import redis

from config import settings

_MAX_DAILY_QUERIES = settings.MAX_DAILY_QUERIES


def _today_utc_str() -> str:
	return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _seconds_until_next_utc_midnight_with_buffer(buffer_seconds: int = 10) -> int:
	now = datetime.now(timezone.utc)
	tomorrow = (now + timedelta(days=1)).date()
	next_midnight = datetime.combine(tomorrow, datetime.min.time(), tzinfo=timezone.utc)
	return max(1, int((next_midnight - now).total_seconds()) + buffer_seconds)


_memory_usage = {
	"date": _today_utc_str(),
	"count": 0,
	"token_date": _today_utc_str(),
	"tokens": 0,
}


def _memory_reset_if_needed() -> None:
	today = _today_utc_str()
	if _memory_usage["date"] != today:
		_memory_usage["date"] = today
		_memory_usage["count"] = 0


def _memory_check_and_increment(_: str) -> tuple[bool, int]:
	_memory_reset_if_needed()
	if _memory_usage["count"] >= _MAX_DAILY_QUERIES:
		return False, _memory_usage["count"]
	_memory_usage["count"] += 1
	return True, _memory_usage["count"]


def _memory_get_daily_count() -> int:
	_memory_reset_if_needed()
	return int(_memory_usage["count"])


_redis_client = None
if settings.REDIS_URL.strip():
	_redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


def _redis_daily_key() -> str:
	return f"paperpilot:usage:{_today_utc_str()}"


def _redis_ip_key(ip: str) -> str:
	return f"paperpilot:ip:{_today_utc_str()}:{ip}"


def _redis_check_and_increment(ip: str) -> tuple[bool, int]:
	daily_key = _redis_daily_key()
	daily_count = int(_redis_client.incr(daily_key))

	if daily_count == 1:
		_redis_client.expire(daily_key, _seconds_until_next_utc_midnight_with_buffer())

	if daily_count > _MAX_DAILY_QUERIES:
		return False, daily_count

	ip_key = _redis_ip_key(ip)
	ip_count = int(_redis_client.incr(ip_key))
	if ip_count == 1:
		_redis_client.expire(ip_key, 60)

	if ip_count > 10:
		return False, daily_count

	return True, daily_count


def _redis_get_daily_count() -> int:
	count = _redis_client.get(_redis_daily_key())
	return int(count) if count else 0


def check_and_increment(ip: str) -> tuple[bool, int]:
	if _redis_client is not None:
		return _redis_check_and_increment(ip)
	return _memory_check_and_increment(ip)


def get_daily_count() -> int:
	if _redis_client is not None:
		return _redis_get_daily_count()
	return _memory_get_daily_count()


def add_tokens(tokens: int) -> int:
	"""Add tokens to today's usage. Returns new total."""
	if _redis_client is not None:
		key = f"paperpilot:tokens:{_today_utc_str()}"
		total = int(_redis_client.incr(key, tokens))
		if total == tokens:
			_redis_client.expire(key, _seconds_until_next_utc_midnight_with_buffer())
		return total

	if _memory_usage.get("token_date") != _today_utc_str():
		_memory_usage["token_date"] = _today_utc_str()
		_memory_usage["tokens"] = 0

	_memory_usage["tokens"] = _memory_usage.get("tokens", 0) + tokens
	return int(_memory_usage["tokens"])


def get_tokens_today() -> int:
	"""Get total tokens used today."""
	if _redis_client is not None:
		key = f"paperpilot:tokens:{_today_utc_str()}"
		val = _redis_client.get(key)
		return int(val) if val else 0

	if _memory_usage.get("token_date") != _today_utc_str():
		return 0
	return int(_memory_usage.get("tokens", 0))


if settings.REDIS_URL.strip():
	try:
		redis.Redis.from_url(settings.REDIS_URL, decode_responses=True).ping()
		print("PaperPilot rate limiter: REDIS mode active")
	except Exception:
		_redis_client = None
		print("PaperPilot rate limiter: REDIS connection FAILED, falling back to IN-MEMORY")
else:
	print("PaperPilot rate limiter: IN-MEMORY mode active")
