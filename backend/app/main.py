from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import assessments, candidate, review, followup, settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessments.router)
app.include_router(candidate.router)
app.include_router(review.router)
app.include_router(followup.router)
app.include_router(settings.router)

@app.get("/")
def read_root():
    return {"message": "AfterQuery Assessment API"}
