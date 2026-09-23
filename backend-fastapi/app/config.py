import os

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
    CORS_PREVIEW_REGEX: str | None = None
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""
    IVA_PORCENTAJE: float = 0.19
    # Chatbot con Google Gemini. La clave vive solo en el servidor.
    # gemini-3.5-flash-lite es el modelo ligero recomendado para proyectos
    # nuevos: rápido y barato, pensado para chat de alto volumen. Se puede
    # cambiar con la variable GEMINI_MODEL sin tocar el código.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def es_serverless(self) -> bool:
        """True cuando corremos como Vercel Function y no como servidor propio."""
        return bool(os.environ.get("VERCEL"))

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                return url.replace("postgres://", "postgresql+psycopg://", 1)
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url

        if self.TURSO_DATABASE_URL:
            url = self.TURSO_DATABASE_URL
            if url.startswith("libsql://"):
                return url.replace("libsql://", "sqlite+libsql://", 1)
            return url

        if self.es_serverless:
            raise RuntimeError(
                "Falta la variable de entorno DATABASE_URL. Configúrala en el proyecto "
                "de Vercel con la cadena de conexión de Neon (la del endpoint '-pooler')."
            )

        # Solo para desarrollo local contra el MySQL antiguo.
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def database_connect_args(self) -> dict[str, str]:
        if self.TURSO_AUTH_TOKEN and not self.DATABASE_URL:
            return {"auth_token": self.TURSO_AUTH_TOKEN}
        return {}

    @property
    def frontend_url_principal(self) -> str:
        """La primera de FRONTEND_URL: la que se usa para armar enlaces."""
        return self.FRONTEND_URL.split(",")[0].strip().rstrip("/")

    @property
    def origenes_cors(self) -> list[str]:
        """FRONTEND_URL acepta varias URLs separadas por coma."""
        origenes = [u.strip().rstrip("/") for u in self.FRONTEND_URL.split(",") if u.strip()]
        origenes.append("http://localhost:5173")
        return list(dict.fromkeys(origenes))

    @property
    def cors_preview_regex(self) -> str | None:
        """Regex para las URLs de preview de Vercel de ESTE proyecto.

        Antes se aceptaba cualquier `*.vercel.app`, lo que dejaba entrar a
        cualquier sitio alojado en Vercel. El patrón se limita al slug de la
        cuenta, que un atacante no controla. Se puede sobrescribir con la
        variable CORS_PREVIEW_REGEX, o desactivar poniéndola en cadena vacía.
        """
        if self.CORS_PREVIEW_REGEX is not None:
            return self.CORS_PREVIEW_REGEX or None
        return r"https://proyecto-react-[a-z0-9]+-sneyderbedoya16-1995s-projects\.vercel\.app"


settings = Settings()
