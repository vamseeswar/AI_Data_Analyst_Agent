import asyncio
import pandas as pd
from services.analysis_service import analyze_dataset

async def test():
    try:
        print("Creating dummy dataframe...")
        df = pd.DataFrame({"A": [1, 2, 3, None], "B": ["x", "y", "z", "w"], "date": ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04']})
        print("Calling analyze_dataset...")
        result = await analyze_dataset(df, "test.xlsx")
        print("Success! Keys in result:", result.keys())
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
