# app/models/__init__.py

## Complexity to avoid circular imports we love python !!!!! ##

# Import base models without dependencies
from .users import User, UserCreate, UserUpdate, UserPublic
from .images import Image, ImageCreate, ImageUpdate, ImagePublic, FileType
from .listings import Listing, ListingCreate, ListingUpdate, ListingPublic, ListingsPublic

# Then import others that may depend on these
import importlib
import os
import pkgutil

# Import remaining modules
for _, module_name, _ in pkgutil.iter_modules([os.path.dirname(__file__)]):
    if module_name not in ['users', 'images', 'listings']:
        importlib.import_module(f"{__name__}.{module_name}")