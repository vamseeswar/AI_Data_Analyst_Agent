import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from prophet import Prophet

def auto_forecast(df: pd.DataFrame, date_col: str, target_col: str, periods: int = 30):
    """
    Use Prophet to forecast time series data.
    """
    try:
        # Prepare data for Prophet
        prophet_df = df[[date_col, target_col]].rename(columns={date_col: 'ds', target_col: 'y'})
        prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])
        
        # Remove NaNs
        prophet_df = prophet_df.dropna()
        
        m = Prophet(daily_seasonality=True)
        m.fit(prophet_df)
        
        future = m.make_future_dataframe(periods=periods)
        forecast = m.predict(future)
        
        # Extract last 'periods' days for the forecast results
        forecast_result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
        
        return {
            "forecast_dates": forecast_result['ds'].dt.strftime('%Y-%m-%d').tolist(),
            "predicted_values": forecast_result['yhat'].tolist(),
            "lower_bound": forecast_result['yhat_lower'].tolist(),
            "upper_bound": forecast_result['yhat_upper'].tolist()
        }
    except Exception as e:
        return {"error": str(e)}

def run_regression(df: pd.DataFrame, feature_cols: list, target_col: str):
    """
    Simple Linear Regression
    """
    try:
        # Drop rows with NaN in features or target
        clean_df = df.dropna(subset=feature_cols + [target_col])
        X = clean_df[feature_cols]
        y = clean_df[target_col]
        
        model = LinearRegression()
        model.fit(X, y)
        
        coef_dict = dict(zip(feature_cols, model.coef_))
        
        return {
            "coefficients": coef_dict,
            "intercept": model.intercept_,
            "r_squared": model.score(X, y)
        }
    except Exception as e:
        return {"error": str(e)}
