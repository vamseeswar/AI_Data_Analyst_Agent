from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
import json
from services.analysis_service import analyze_dataset

router = APIRouter()

@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # Basic cleaning and processing
        # Convert it to JSON for analysis
        result = await analyze_dataset(df, file.filename)
        return {"status": "success", "data": result}
        
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
