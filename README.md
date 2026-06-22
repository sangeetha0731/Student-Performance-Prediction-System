# Student Performance Prediction System - Brief Documentation

## Problem Statement

Identifying students at risk of underperforming is critical in education. By predicting a student's final grade (G3) based on current academic standing (G1, G2), study habits, and personal circumstances, educators can take proactive measures to improve outcomes.

---

## Features (10 key predictors)

- **G1 & G2**: First and second period grades (0-20)
- **studytime**: Weekly study time (1-4)
- **failures**: Number of past class failures
- **absences**: Number of school absences
- **health & famrel**: Health status and family relationship quality (1-5)
- **higher, internet, schoolsup**: Categorical yes/no flags for higher education aspirations, internet access, extra school support

**Target Variable**: 
- **G3**: Final grade (0-20)

**Dataset**: student_data_expanded_5000.csv (5000 rows generated via Synthetic Data Vault)

---

## Model Information

**Algorithm**: Random Forest Regressor

**Hyperparameters**:
- n_estimators=200
- max_depth=5
- min_samples_split=5
- min_samples_leaf=1

**Key Processing Steps**:
1. Load expanded dataset (5000 rows)
2. Feature selection (10 critical predictors)
3. Categorical encoding (yes/no → 1/0)
4. StandardScaler normalization
5. Model training and optimization
6. Export model and scaler as .pkl files

**Libraries**: pandas, scikit-learn, numpy, joblib, Flask, matplotlib

---

## Project Structure

```
student-performance/
├── app.py                              # Flask web application
├── main.py                             # ML model training pipeline
├── new_dataset.py                      # Synthetic data generation
├── requirements.txt                    # Dependencies
├── student_data.csv                    # Original dataset
├── student_data_expanded_5000.csv      # Expanded training dataset
├── student_model.pkl                   # Trained Random Forest model
├── scaler.pkl                          # StandardScaler
├── static/
│   ├── style.css
│   ├── script.js
│   ├── radar_chart.png
│   ├── heatmap.png
│   └── comparison_chart.png
└── templates/
    ├── index.html
    ├── predict.html
    └── result.html
```

---

## Installation & Usage

### Prerequisites
- Python 3.8+
- Git

### Setup

Clone and navigate to repository:
```bash
git clone <repository-url>
cd <repository-name>
```

Create and activate virtual environment:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

Execute Flask application:
```bash
python app.py
```

Access in browser:
```
http://localhost:5000
```

---

## How It Works

1. User fills out student data form on frontend
2. JavaScript sends JSON payload via POST to `/predict` endpoint
3. Flask backend validates and transforms data:
   - Maps categorical variables to 1/0
   - Applies StandardScaler normalization
4. Random Forest model predicts final grade
5. Backend computes:
   - Predicted grade and percentage
   - Grade band categorization (Excellent, Average, Needs Improvement)
   - Feature impact analysis vs. class median
   - What-if scenarios for study time and absences
6. JSON response rendered on results page

---

## Expected Outputs

The application displays:
- **Predicted final grade** out of 20 with percentage
- **Grade banding**: Excellent / Average / Needs Improvement
- **Personalized advice**: Actionable recommendations based on student inputs
- **Feature impact analysis**: Shows which factors help or hurt performance
- **What-if scenarios**: Simulates impact of changing study time or absences
- **Radar charts & visualizations**: Compares student profile to class metrics

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Activate virtual environment and run `pip install -r requirements.txt` |
| `FileNotFoundError: Dataset not found` | Run scripts from project root directory |
| Port 5000 in use | Change port in `app.py`: `app.run(debug=True, port=5001)` |

---

## Key Features

✅ **Real-time Grade Prediction** - Instant predictions from student input  
✅ **Personalized Advice** - Rule-based recommendations  
✅ **Feature Impact Analysis** - Shows helping/hurting factors  
✅ **What-If Scenarios** - Simulate changes in study time/absences  
✅ **Interactive Visualizations** - Radar charts and comparisons  
✅ **Grade Banding** - Categorizes predictions into meaningful bands  

---

## Future Improvements

- Deploy to cloud platform (Heroku, AWS, Render)
- Replace CSV with relational database (PostgreSQL, SQLite)
- Implement user authentication for grade tracking
- Add classification models for pass/fail predictions
- Store predictions and collect user feedback
