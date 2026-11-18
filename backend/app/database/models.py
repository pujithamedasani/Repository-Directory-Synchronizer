"""
SQLAlchemy ORM models for SyncSphere.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import relationship
from app.database.database import Base


class SyncSession(Base):
    __tablename__ = "sync_sessions"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    source_dir = Column(String(1024), nullable=False)
    dest_dir = Column(String(1024), nullable=False)
    files_copied = Column(Integer, default=0)
    files_updated = Column(Integer, default=0)
    files_deleted = Column(Integer, default=0)
    files_skipped = Column(Integer, default=0)
    bytes_transferred = Column(BigInteger, default=0)
    status = Column(String(20), default="pending")  # pending/running/completed/failed/cancelled
    error_details = Column(Text, nullable=True)
    sync_mode = Column(String(20), default="one_way")

    operations = relationship("FileOperation", back_populates="session", cascade="all, delete-orphan")


class FileOperation(Base):
    __tablename__ = "file_operations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sync_sessions.id"), nullable=False)
    file_path = Column(String(2048), nullable=False)
    operation_type = Column(String(20), nullable=False)  # copy/update/delete/skip/conflict
    file_size = Column(BigInteger, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="success")
    error = Column(Text, nullable=True)

    session = relationship("SyncSession", back_populates="operations")


class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MonitorEvent(Base):
    __tablename__ = "monitor_events"

    id = Column(Integer, primary_key=True, index=True)
    directory = Column(String(1024), nullable=False)
    event_type = Column(String(20), nullable=False)  # created/modified/deleted/moved
    file_path = Column(String(2048), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
