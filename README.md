# GradeScope — Student Performance Predictor

GradeScope is an end-to-end Machine Learning web application designed to predict a student's final period grade ($G3$, out of 20) based on their academic history, study habits, and support systems. The application is built using a Flask backend, a modern glassmorphism frontend dashboard, and a tuned Random Forest Regressor trained on 5,000+ student profiles.

---

## 🚀 Key Features

* **Tuned Machine Learning Core**: Random Forest Regressor tuned via cross-validation to prevent overfitting, achieving a **Mean Absolute Error (MAE) of 1.35** and an **$R^2$ Score of 0.74**.
* **Vectorized "What-If" Simulator**: Dynamic frontend graphs (powered by Chart.js) showing how predicted grades change with weekly study time and attendance, optimized via batched matrix predictions in the backend.
* **Feature Impact Profiling**: Compares student metrics against historical medians to flag positive and negative academic performance drivers.
* **Personalized Academic Advice**: Rule-based feedback engine offering tailored recommendations to improve predicted grades.
* **Robust REST API**: Complete input parsing, schema enforcement, and out-of-bound checks returning standard HTTP statuses.

---

## 📂 Codebase Architecture

```directory
MLF_project/
├── app.py                            # Flask server, prediction handler, and REST API
├── main.py                           # Modulized ML pipeline (train, test, and model serialize)
├── new_dataset.py                    # SDV GaussianCopula synthesizer script
├── student_data.csv                  # Original Student Alcohol Consumption dataset
├── student_data_expanded_5000.csv    # Synthetically expanded 5,000-row training dataset
├── student_model.pkl                 # Serialized tuned Random Forest Regressor
├── scaler.pkl                        # Serialized StandardScaler
├── metadata.json                     # SDV Metadata json schema
├── templates/                        # Flask HTML templates
│   ├── index.html                    # Welcome landing page
│   ├── predict.html                  # Inputs form (with custom sliders/toggles)
│   └── result.html                   # Analytics dashboard and What-If charts
└── static/                           # Public assets
    ├── style.css                     # Premium dark theme stylesheet
    └── script.js                     # Frontend API controller and Chart.js renderer
```

---

## 📊 Model Training & Preprocessing

The model utilizes **10 key features** selected from 32 candidates in the original dataset based on correlation metrics:

| Feature Name | Type | Value Range | Description |
| :--- | :--- | :--- | :--- |
| `G2` | Continuous | 0 – 20 | Grade during the second term (highest predictor weight) |
| `G1` | Continuous | 0 – 20 | Grade during the first term |
| `absences` | Discrete | 0 – 93 | Total number of days missed |
| `failures` | Discrete | 0 – 3 | Number of previously failed classes |
| `studytime` | Ordinal | 1 – 4 | Weekly study hours ($1$: $<2\text{h}$, $2$: $2$-$5\text{h}$, $3$: $5$-$10\text{h}$, $4$: $>10\text{h}$) |
| `health` | Ordinal | 1 – 5 | Self-reported health status ($1$: Very bad, $5$: Excellent) |
| `famrel` | Ordinal | 1 – 5 | Family relationship quality ($1$: Very bad, $5$: Excellent) |
| `higher` | Categorical | `yes` / `no` | Aspirations to pursue higher education |
| `schoolsup` | Categorical | `yes` / `no` | Receives extra educational support |
| `internet` | Categorical | `yes` / `no` | Internet access at home |

---

## 🛠️ Installation & Setup

### Prerequisites
* Python 3.10+
* Virtualenv (optional but recommended)

### 1. Set Up Environment
Clone the project, change into the directory, and set up your virtual environment:
```bash
cd MLF_project
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```
*(If requirements.txt is not yet generated, install packages manually: `pip install flask pandas scikit-learn joblib matplotlib sdv`)*

---

## 🏃 Run Instructions

### 1. Synthesize Expanded Dataset (Optional)
If you want to regenerate or expand the synthetic student profiles using the Gaussian Copula Synthesizer:
```bash
python new_dataset.py
```

### 2. Train the Model
Train the Random Forest Regressor and serialize artifacts (`student_model.pkl` and `scaler.pkl`):
```bash
python main.py
```

### 3. Launch Flask App
Start the development server:
```bash
python app.py
```
Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 📡 API Documentation

### POST `/predict`
Enforces input validation and predicts the final grade along with scenario arrays.

#### Request Headers
`Content-Type: application/json`

#### Request Payload Example
```json
{
  "G1": 15,
  "G2": 16,
  "studytime": 3,
  "failures": 0,
  "absences": 2,
  "higher": "yes",
  "internet": "yes",
  "schoolsup": "no",
  "health": 4,
  "famrel": 5
}
```

#### Response Example (`200 OK`)
```json
{
  "predicted_grade": 16.1,
  "percentage": 80.5,
  "class_average": 11.53,
  "grade_band": "Excellent",
  "band_color": "#22c55e",
  "vs_average": "above",
  "radar_data": {
    "labels": ["G1", "G2", "Study Time", "Health", "Family Relation", "Low Absences"],
    "values": [75.0, 80.0, 75.0, 80.0, 100.0, 90.0]
  },
  "feature_impact": {
    "G2": { "value": 16, "impact": "positive", "importance": 0.9463 },
    "absences": { "value": 2, "impact": "positive", "importance": 0.0433 }
  },
  "whatif_studytime": [
    { "studytime": 1, "grade": 16.1 },
    { "studytime": 2, "grade": 16.1 }
  ],
  "advice": [
    "Your grade improved from G1 (15) to G2 (16) — this positive trend is a strong signal."
  ]
}
```

#### Error Response Example (`400 Bad Request`)
Returned if fields are missing, invalid, or out of expected bounds:
```json
{
  "error": "Field 'G1' must be an integer between 0 and 20."
}
```
