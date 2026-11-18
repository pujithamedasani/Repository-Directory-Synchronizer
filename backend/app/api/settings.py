"""
API — Application settings.
"""
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import AppSetting
from app.config import DEFAULT_SETTINGS

router = APIRouter()


def _get_all_settings(db: Session) -> dict:
    rows = db.query(AppSetting).all()
    settings = dict(DEFAULT_SETTINGS)  # start with defaults
    for row in rows:
        settings[row.key] = row.value
    return settings


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    return _get_all_settings(db)


@router.put("/")
def update_settings(body: dict, db: Session = Depends(get_db)):
    for key, value in body.items():
        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        if row:
            row.value = str(value)
            row.updated_at = datetime.utcnow()
        else:
            db.add(AppSetting(key=key, value=str(value)))
    db.commit()
    return _get_all_settings(db)


@router.post("/reset")
def reset_settings(db: Session = Depends(get_db)):
    db.query(AppSetting).delete()
    db.commit()
    return DEFAULT_SETTINGS
