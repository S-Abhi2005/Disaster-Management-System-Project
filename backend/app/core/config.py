import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Disaster Response System")
    ENV: str = os.getenv("ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/disaster_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

settings = Settings()
