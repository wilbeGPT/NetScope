from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from core.database import engine
from core import models
from routers import investigations, chat

# Automatically create all tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NetScope API")

# Allow frontend to access the API during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated R plots
os.makedirs("./data/exports", exist_ok=True)
app.mount("/exports", StaticFiles(directory="./data/exports"), name="exports")

# Include routers
app.include_router(investigations.router, prefix="/api/investigations", tags=["Investigations"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
