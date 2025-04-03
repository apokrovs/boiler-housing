from fastapi import APIRouter

from app.core.config import settings
from app.api.routes import (
    items,
    login,
    users,
    utils,
    private,
    messages,
    faq,
    listings
)

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(messages.router)
api_router.include_router(faq.router)
api_router.include_router(listings.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)