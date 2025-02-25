# app/models/__init__.py
import importlib
import os
import pkgutil

# Iterate through all modules in the current package
# and import them automatically
for _, module_name, _ in pkgutil.iter_modules([os.path.dirname(__file__)]):
    # Import the module
    importlib.import_module(f"{__name__}.{module_name}")
