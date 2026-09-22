from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PORT: int = 8000
    DATABASE_URL: str | None = None
    TURSO_DATABASE_URL: str | None = None
    TURSO_AUTH_TOKEN: str | None = None
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "ktm_motos"
    JWT_SECRET: str = "cambia_esta_clave"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRA_HORAS: int = 8
    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""
    IVA_PORCENTAJE: float = 0.19

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def database_url(self) -> str:
        if self.TURSO_DATABASE_URL:
            url = self.TURSO_DATABASE_URL
            if url.startswith("libsql://"):
                return url.replace("libsql://", "sqlite+libsql://", 1)
            return url

        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                return url.replace("postgres://", "postgresql+psycopg://", 1)
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url

        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def database_connect_args(self) -> dict[str, str]:
        if self.TURSO_AUTH_TOKEN:
            return {"auth_token": self.TURSO_AUTH_TOKEN}
        return {}


settings = Settings()
