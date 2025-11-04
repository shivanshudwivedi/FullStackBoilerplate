from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from ..services.database_service import database_service

router = APIRouter()

class Setting(BaseModel):
    key: str
    value: Any

@router.get("/settings/{key}")
def get_setting(key: str):
    try:
        setting = database_service.get_setting(key)
        if not setting:
            raise HTTPException(status_code=404, detail="Setting not found")
        return setting
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
def set_setting(setting: Setting):
    try:
        database_service.set_setting(setting.key, setting.value)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
