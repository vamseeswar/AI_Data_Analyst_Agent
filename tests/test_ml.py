import pandas as pd
import numpy as np
from backend.ml.predictor import run_regression, auto_forecast

def test_run_regression():
    # Create simple linear dataset
    df = pd.DataFrame({
        'feature_1': [1, 2, 3, 4, 5],
        'target': [2, 4, 6, 8, 10]
    })
    
    result = run_regression(df, ['feature_1'], 'target')
    
    assert "error" not in result
    assert "coefficients" in result
    assert result["r_squared"] == 1.0  # Perfect fit

def test_auto_forecast_invalid_data():
    # Not enough data for prophet
    df = pd.DataFrame({
        'ds': ['2023-01-01', '2023-01-02'],
        'y': [1, 2]
    })
    result = auto_forecast(df, 'ds', 'y')
    # Prophet requires at least 2 non-NaN rows, but we are testing it doesn't crash fatally
    assert isinstance(result, dict)
