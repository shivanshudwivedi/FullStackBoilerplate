from fastapi import APIRouter, HTTPException
from ..services.database_service import database_service

router = APIRouter()

@router.get("/dashboard/stats")
def get_dashboard_stats():
    try:
        stats = database_service.get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/funnel")
def get_candidate_funnel():
    try:
        funnel_data = database_service.get_candidate_funnel()
        return funnel_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/performance")
def get_assessment_performance():
    try:
        performance_data = database_service.get_assessment_performance()
        return performance_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/leaderboard")
def get_candidate_leaderboard():
    try:
        leaderboard_data = database_service.get_candidate_leaderboard()
        return leaderboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
