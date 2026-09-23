from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

url = settings.database_url

# En serverless cada invocación puede caer en una instancia distinta, así que
# mantener un pool propio no sirve de nada y agota las conexiones de Neon.
# Neon ya trae su propio pooler (el host que termina en '-pooler').
if settings.es_serverless and url.startswith("postgresql"):
    engine = create_engine(url, poolclass=NullPool, connect_args=settings.database_connect_args)
else:
    engine = create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args=settings.database_connect_args,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependencia de FastAPI: entrega una sesión de BD y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
