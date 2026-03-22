from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	GROQ_API_KEY: str
	GROQ_MODEL: str = "llama3-8b-8192"
	MAX_DAILY_QUERIES: int = 100
	REDIS_URL: str = ""
	HF_TOKEN: str = ""

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)


settings = Settings()
