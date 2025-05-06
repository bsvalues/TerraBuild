
import shap
import xgboost as xgb
import pandas as pd
import numpy as np

# Simulated input for cost modeling
def generate_demo_matrix():
    return pd.DataFrame({
        "living_area": [1000, 1200, 1400, 1600, 1800],
        "year_built": [1980, 1990, 2000, 2010, 2020],
        "roof_type": [0, 1, 0, 1, 1],
        "garage": [1, 2, 2, 3, 3],
        "base_cost": [122000, 134000, 145000, 158000, 169000]
    })

def run_shap_analysis(df: pd.DataFrame):
    X = df.drop("base_cost", axis=1)
    y = df["base_cost"]
    
    model = xgb.XGBRegressor(n_estimators=50, max_depth=4)
    model.fit(X, y)
    
    explainer = shap.Explainer(model)
    shap_values = explainer(X)

    impact = np.abs(shap_values.values).mean(axis=0)
    summary = dict(zip(X.columns, impact))
    ranked = sorted(summary.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "top_features": ranked[:3],
        "all_features": summary
    }

if __name__ == "__main__":
    df = generate_demo_matrix()
    result = run_shap_analysis(df)
    print("Top SHAP Features:", result["top_features"])
