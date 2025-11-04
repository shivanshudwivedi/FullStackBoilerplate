from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import assessments, candidate, review, followup, settings

app = FastAPI(title="Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessments.router, prefix="/api")
app.include_router(candidate.router, prefix="/api")
app.include_router(review.router, prefix="/api")
app.include_router(followup.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AfterQuery Assessment API"}
