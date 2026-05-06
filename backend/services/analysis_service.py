import pandas as pd
from services.groq_service import generate_insights
from ml.predictor import auto_forecast, run_regression

async def analyze_dataset(df: pd.DataFrame, filename: str):
    # Data Cleaning: Handle some basic types
    columns = df.columns.tolist()
    
    # Generate basic stats
    summary_stats = df.describe(include='all').to_dict()
    missing_values = df.isnull().sum().to_dict()
    
    # Ensure types are serializable
    def make_serializable(d):
        for k, v in d.items():
            if isinstance(v, dict):
                make_serializable(v)
            else:
                try:
                    if pd.isna(v):
                        d[k] = None
                except Exception:
                    pass
        return d
    
    summary_stats = make_serializable(summary_stats)
    
    # Try to find a date column and a numeric column for forecasting
    date_cols = df.select_dtypes(include=['datetime64', 'object']).columns
    numeric_cols = df.select_dtypes(include=['number']).columns
    
    ml_results = {}
    
    # A simple heuristic for time series: if there's a date-like column and a numeric column
    likely_date_col = None
    for col in date_cols:
        if 'date' in col.lower() or 'time' in col.lower():
            likely_date_col = col
            break
            
    if likely_date_col and len(numeric_cols) > 0:
        target_col = numeric_cols[0] # Just pick the first numeric col for demo
        try:
            # check if it can be parsed to datetime
            pd.to_datetime(df[likely_date_col].iloc[0])
            forecast = auto_forecast(df, likely_date_col, target_col)
            if "error" not in forecast:
                ml_results["forecast"] = {
                    "target_column": target_col,
                    "date_column": likely_date_col,
                    "data": forecast
                }
        except:
            pass
            
    # LLM Insights
    insights = await generate_insights(filename, columns, summary_stats, missing_values)
    
    # Fix preview data NaN values by replacing them with None to be valid JSON
    preview_df = df.head(100).where(pd.notnull(df.head(100)), None)
    
    return {
        "filename": filename,
        "columns": columns,
        "rows_count": len(df),
        "missing_values": missing_values,
        "summary_stats": summary_stats,
        "ai_insights": insights,
        "ml_predictions": ml_results,
        "preview_data": preview_df.to_dict(orient="records")
    }
