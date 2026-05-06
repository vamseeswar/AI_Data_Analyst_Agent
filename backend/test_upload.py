import pandas as pd
import requests

try:
    df = pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6], "date": ['2023-01-01', '2023-01-02', '2023-01-03']})
    df.to_excel("test.xlsx", index=False)

    with open("test.xlsx", "rb") as f:
        files = {"file": ("test.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        response = requests.post("http://localhost:8000/api/v1/analyze", files=files)
        print("Status Code:", response.status_code)
        print("Response:", response.text)
except Exception as e:
    print("Error:", e)
