from flask import Flask, request, jsonify, render_template
import pandas as pd
import joblib
import numpy as np

import matplotlib
matplotlib.use("Agg")
from matplotlib.figure import Figure

app = Flask(__name__)

# ==========================================
# LOAD MODEL + SCALER
# ==========================================

model = joblib.load("student_model.pkl")
scaler = joblib.load("scaler.pkl")

# ==========================================
# LOAD DATASET + PRE-COMPUTE STATS (Startup)
# ==========================================

dataset = pd.read_csv("student_data_expanded_5000.csv")
class_average = round(dataset["G3"].mean(), 2)

# Pre-compute feature medians globally once at startup (Performance Optimization)
medians = {
    "studytime" : dataset["studytime"].median(),
    "failures"  : dataset["failures"].median(),
    "absences"  : dataset["absences"].median(),
    "health"    : dataset["health"].median(),
    "famrel"    : dataset["famrel"].median(),
    "G1"        : dataset["G1"].median(),
    "G2"        : dataset["G2"].median()
}

# ==========================================
# FEATURE IMPORTANCES (pre-computed at startup)
# ==========================================

feature_names = [
    "studytime",
    "failures",
    "absences",
    "higher",
    "internet",
    "schoolsup",
    "health",
    "famrel",
    "G1",
    "G2"
]

feature_importances = dict(
    zip(feature_names, model.feature_importances_)
)

# ==========================================
# INPUT VALIDATION HELPER
# ==========================================

def validate_input(data):
    """Validates the input JSON fields for structure, types, and bounds."""
    if not data or not isinstance(data, dict):
        return "Invalid request format. Expected JSON object."

    required_fields = ["studytime", "failures", "absences", "higher", "internet", "schoolsup", "health", "famrel", "G1", "G2"]
    
    # Check all fields exist
    for field in required_fields:
        if field not in data:
            return f"Missing required field: '{field}'"

    # Validate integer fields
    int_fields = {
        "studytime": (1, 4),
        "failures": (0, 100),
        "absences": (0, 365),
        "health": (1, 5),
        "famrel": (1, 5),
        "G1": (0, 20),
        "G2": (0, 20)
    }

    for field, (min_val, max_val) in int_fields.items():
        try:
            val = int(data[field])
            if val < min_val or val > max_val:
                return f"Field '{field}' must be an integer between {min_val} and {max_val}."
        except (ValueError, TypeError):
            return f"Field '{field}' must be a valid integer."

    # Validate categorical fields
    cat_fields = ["higher", "internet", "schoolsup"]
    for field in cat_fields:
        if data[field] not in ["yes", "no"]:
            return f"Field '{field}' must be either 'yes' or 'no'."

    return None

# ==========================================
# PAGES
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict-page")
def predict_page():
    return render_template("predict.html")

@app.route("/result-page")
def result_page():
    return render_template("result.html")

# ==========================================
# PREDICT API
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    # Input validation (HTTP 400)
    error_msg = validate_input(data)
    if error_msg:
        return jsonify({"error": error_msg}), 400

    # ==========================================
    # BUILD INPUT DATAFRAME
    # ==========================================

    input_data = pd.DataFrame([{
        "studytime"  : int(data["studytime"]),
        "failures"   : int(data["failures"]),
        "absences"   : int(data["absences"]),
        "higher"     : data["higher"],
        "internet"   : data["internet"],
        "schoolsup"  : data["schoolsup"],
        "health"     : int(data["health"]),
        "famrel"     : int(data["famrel"]),
        "G1"         : int(data["G1"]),
        "G2"         : int(data["G2"])
    }])

    # ==========================================
    # ENCODE CATEGORICAL COLUMNS
    # ==========================================

    binary_map = {
        "yes": 1,
        "no" : 0
    }

    for col in ["higher", "internet", "schoolsup"]:
        input_data[col] = input_data[col].map(binary_map)

    # ==========================================
    # SCALE
    # ==========================================

    input_scaled = scaler.transform(input_data)

    # ==========================================
    # PREDICT
    # ==========================================

    predicted_grade = round(float(model.predict(input_scaled)[0]), 2)
    percentage      = round((predicted_grade / 20) * 100, 2)

    # ==========================================
    # GRADE BAND
    # ==========================================

    if predicted_grade >= 14:
        grade_band  = "Excellent"
        band_color  = "#22c55e"

    elif predicted_grade >= 10:
        grade_band  = "Average"
        band_color  = "#f59e0b"

    else:
        grade_band  = "Needs Improvement"
        band_color  = "#ef4444"

    # ==========================================
    # VS CLASS AVERAGE
    # ==========================================

    if predicted_grade >= class_average:
        vs_average = "above"
    else:
        vs_average = "below"

    # ==========================================
    # FEATURE IMPACT
    # Compares each student value to dataset median.
    # Flags whether that feature is helping or hurting.
    # ==========================================

    # For these features, higher = better
    positive_features = ["studytime", "health", "famrel", "G1", "G2"]

    # For these features, lower = better
    negative_features = ["failures", "absences"]

    # For yes/no features
    yes_good_features = ["higher", "internet", "schoolsup"]

    feature_impact = {}

    for feat in positive_features:
        val    = float(input_data[feat].iloc[0])
        median = medians[feat]
        impact = "positive" if val >= median else "negative"
        feature_impact[feat] = {
            "value"      : data[feat],
            "impact"     : impact,
            "importance" : round(feature_importances[feat], 4)
        }

    for feat in negative_features:
        val    = float(input_data[feat].iloc[0])
        median = medians[feat]
        impact = "negative" if val > median else "positive"
        feature_impact[feat] = {
            "value"      : data[feat],
            "impact"     : impact,
            "importance" : round(feature_importances[feat], 4)
        }

    for feat in yes_good_features:
        raw    = data[feat]
        impact = "positive" if raw == "yes" else "negative"
        feature_impact[feat] = {
            "value"      : raw,
            "impact"     : impact,
            "importance" : round(feature_importances[feat], 4)
        }

    # ==========================================
    # RADAR CHART DATA (normalised to 0-100)
    # ==========================================

    radar_data = {
        "labels": [
            "G1",
            "G2",
            "Study Time",
            "Health",
            "Family Relation",
            "Low Absences"
        ],
        "values": [
            round(int(data["G1"]) * 5, 2),
            round(int(data["G2"]) * 5, 2),
            round(int(data["studytime"]) * 25, 2),
            round(int(data["health"]) * 20, 2),
            round(int(data["famrel"]) * 20, 2),
            round(max(0, 100 - int(data["absences"]) * 5), 2)
        ]
    }

    # ==========================================
    # WHAT-IF RANGE DATA (Optimized: Vectorized batch predictions)
    # ==========================================

    # 1. Study time scenario
    st_values = [1, 2, 3, 4]
    wf_st_df = pd.concat([input_data.assign(studytime=st) for st in st_values], ignore_index=True)
    wf_st_scaled = scaler.transform(wf_st_df)
    st_preds = model.predict(wf_st_scaled)
    
    whatif_studytime = [
        {"studytime": st, "grade": round(float(grade), 2)}
        for st, grade in zip(st_values, st_preds)
    ]

    # 2. Absences scenario
    ab_values = [0, 5, 10, 15, 20, 30]
    wf_ab_df = pd.concat([input_data.assign(absences=ab) for ab in ab_values], ignore_index=True)
    wf_ab_scaled = scaler.transform(wf_ab_df)
    ab_preds = model.predict(wf_ab_scaled)
    
    whatif_absences = [
        {"absences": ab, "grade": round(float(grade), 2)}
        for ab, grade in zip(ab_values, ab_preds)
    ]

    # ==========================================
    # PERSONALISED ADVICE
    # Rule-based, no external API needed.
    # ==========================================

    advice = []

    if int(data["failures"]) > 0:
        advice.append(
            f"You have {data['failures']} past failure(s). "
            "This is the single biggest drag on predicted performance — "
            "consider extra support sessions or tutoring."
        )

    if int(data["absences"]) > 10:
        advice.append(
            f"Your {data['absences']} absences are likely costing you "
            "at least 1–2 grade points. Consistent attendance has a "
            "direct and measurable impact on final grades."
        )

    if int(data["studytime"]) <= 1:
        advice.append(
            "Less than 2 hours of study per week is below what most "
            "high performers report. Even moving to 2–5 hours could "
            "meaningfully improve your predicted grade."
        )

    if data["schoolsup"] == "no" and predicted_grade < class_average:
        advice.append(
            "You are currently below the class average and not using "
            "school support. Enrolling in school support is a free "
            "resource that correlates with grade improvement."
        )

    if int(data["G2"]) > int(data["G1"]):
        advice.append(
            f"Your grade improved from G1 ({data['G1']}) to "
            f"G2 ({data['G2']}) — this positive trend is a strong "
            "signal. Keep the momentum going into the final period."
        )
    elif int(data["G2"]) < int(data["G1"]):
        advice.append(
            f"Your grade dropped from G1 ({data['G1']}) to "
            f"G2 ({data['G2']}). Identifying what changed between "
            "these periods could help you recover before finals."
        )

    if data["higher"] == "no":
        advice.append(
            "Students who aspire to higher education consistently "
            "outperform those who don't. Setting a clear academic "
            "goal can be a strong motivator."
        )

    if not advice:
        advice.append(
            "Your profile looks strong overall. Stay consistent "
            "with your current habits and focus on maintaining "
            "your attendance and study routine."
        )

    # ==========================================
    # RETURN
    # ==========================================

    return jsonify({

        # Core result
        "predicted_grade" : predicted_grade,
        "percentage"      : percentage,
        "class_average"   : class_average,
        "grade_band"      : grade_band,
        "band_color"      : band_color,
        "vs_average"      : vs_average,

        # Charts
        "radar_data"      : radar_data,

        # Analytics
        "feature_impact"  : feature_impact,
        "whatif_studytime": whatif_studytime,
        "whatif_absences" : whatif_absences,

        # Advice
        "advice"          : advice
    })

# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    app.run(debug=True)