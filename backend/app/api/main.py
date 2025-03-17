from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import (
    items,
    login,
    users,
    utils,
    private,
    messages,
    mailgun
)
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend's URL if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router and include all routes
api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(messages.router)
api_router.include_router(mailgun.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)

# Include the API router in the FastAPI app
app.include_router(api_router)

# Example root endpoint (optional)
@app.get("/")
async def read_root():
    logger.info("Root endpoint called")
    return {"message": "Welcome to the API"}