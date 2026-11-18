"""
SyncSphere Backend Configuration
"""
from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "SyncSphere"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/syncsphere.db"

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Sync defaults
    DEFAULT_CHUNK_SIZE: int = 1024 * 1024  # 1MB
    MAX_FILE_SIZE: int = 10 * 1024 * 1024 * 1024  # 10GB

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

DEFAULT_SETTINGS = {
    "default_sync_mode": "one_way",
    "auto_sync_enabled": "false",
    "auto_sync_interval": "300",
    "include_hidden_files": "false",
    "use_checksum": "true",
    "delete_extra_files": "false",
    "preserve_timestamps": "true",
    "notifications_enabled": "true",
    "theme": "dark",
}
