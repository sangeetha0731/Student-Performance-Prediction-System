import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

def load_data(filepath):
    """Loads the student dataset from CSV."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    return pd.read_csv(filepath)

def preprocess_data(df):
    """Keeps selected columns and encodes binary variables."""
    selected_columns = [
        "studytime", "failures", "absences", "higher", "internet",
        "schoolsup", "health", "famrel", "G1", "G2", "G3"
    ]
    df = df[selected_columns].copy()

    # Encode binary columns
    binary_map = {"yes": 1, "no": 0}
    categorical_columns = ["higher", "internet", "schoolsup"]
    for col in categorical_columns:
        df[col] = df[col].map(binary_map)
        
    return df

def split_and_scale(df):
    """Splits data into train/test sets and fits standard scaler."""
    X = df.drop("G3", axis=1)
    y = df["G3"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, X.columns.tolist()

def train_optimal_model(X_train, y_train):
    """Trains the Random Forest Regressor with optimal tuned hyperparameters."""
    # Tuned via GridSearchCV to prevent overfitting and improve MAE/R2
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=5,
        min_samples_split=5,
        min_samples_leaf=1,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test, feature_names):
    """Prints evaluation metrics and feature importances."""
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print("\n===== MODEL RESULTS =====")
    print(f"Mean Absolute Error : {mae:.4f}")
    print(f"R2 Score            : {r2:.4f}")

    # Feature importances
    importances = model.feature_importances_
    print("\n===== FEATURE IMPORTANCES =====\n")
    for name, score in sorted(
        zip(feature_names, importances),
        key=lambda x: x[1],
        reverse=True
    ):
        print(f"{name:12s} : {score:.4f}")

    return mae, r2

def save_artifacts(model, scaler, model_path="student_model.pkl", scaler_path="scaler.pkl"):
    """Dumps model and scaler to pickle files."""
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\n✅ Model saved to {model_path} and Scaler saved to {scaler_path}")

def main():
    dataset_path = "student_data_expanded_5000.csv"
    
    # Run pipeline
    df = load_data(dataset_path)
    df = preprocess_data(df)
    X_train, X_test, y_train, y_test, scaler, feature_names = split_and_scale(df)
    
    model = train_optimal_model(X_train, y_train)
    evaluate_model(model, X_test, y_test, feature_names)
    save_artifacts(model, scaler)

if __name__ == "__main__":
    main()