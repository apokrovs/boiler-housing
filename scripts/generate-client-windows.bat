@echo on
REM Execute the equivalent commands
cd backend
python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ..\openapi.json
cd ..
move openapi.json frontend\
cd frontend
call npm run generate-client
call npx biome format --write .\src\client
@echo off