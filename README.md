# Student Performance Prediction System

## 1. Project Title
Student Performance Prediction System

## 2. Project Overview
This project is an end-to-end Machine Learning web application designed to predict a student's final grade based on various demographic, social, and school-related features. It provides an interactive web interface where users can input student data and receive an instant prediction, along with personalized advice and visual analytics.

## 3. Problem Statement
Identifying students who are at risk of underperforming is a critical challenge in education. By predicting a student's final grade based on their current academic standing (G1, G2), study habits, and personal circumstances, educators and students themselves can take proactive measures, such as adjusting study time or seeking school support, to improve final outcomes.

## 4. Features
*   **Real-time Grade Prediction**: Predicts the final grade (G3) out of 20 and calculates the percentage.
*   **Grade Banding**: Categorizes the prediction into "Excellent", "Average", or "Needs Improvement".
*   **Personalized Advice**: Generates actionable, rule-based advice based on the student's specific inputs (e.g., absences, past failures).
*   **Feature Impact Analysis**: Compares the student's metrics to the class median to show which factors are helping or hurting their grade.
*   **What-If Scenarios**: Simulates how changes in "study time" and "absences" would impact the final predicted grade.
*   **Visualizations**: Provides data for a comprehensive radar chart comparing the student's profile across key metrics.

## 5. Tech Stack
*   **Backend**: Python, Flask
*   **Machine Learning**: Scikit-learn, Pandas, Numpy, Joblib, SDV (Synthetic Data Vault)
*   **Frontend**: HTML, CSS, Vanilla JavaScript
*   **Visualization**: Matplotlib

## 6. Project Architecture
The project follows a modular architecture:
1.  **Data Generation & Processing**: `new_dataset.py` expands the original dataset using Synthetic Data Vault (SDV) to generate a robust 5000-row dataset.
2.  **Model Training**: `main.py` handles data loading, preprocessing, scaling, training the Random Forest Regressor, and saving the model artifacts.
3.  **Web Application (API & Frontend)**: `app.py` serves the frontend templates and exposes a `/predict` REST API endpoint that handles input validation, feature transformation, prediction, and analytics generation.

## 7. Folder Structure
```text
.
├── app.py                                # Main Flask application
├── main.py                               # ML model training pipeline
├── new_dataset.py                        # Synthetic data generation script
├── requirements.txt                      # Project dependencies
├── models_testing.ipynb                  # Jupyter notebook for model exploration
├── student_data.csv                      # Original dataset
├── student_data_expanded_5000.csv        # Expanded dataset for training
├── metadata.json                         # SDV metadata configuration
├── student_model.pkl                     # Trained Random Forest model
├── scaler.pkl                            # Trained StandardScaler
├── static/                               # Static assets (CSS, JS, Images)
│   ├── style.css
│   ├── script.js
│   ├── radar_chart.png
│   ├── heatmap.png
│   └── comparison_chart.png
└── templates/                            # HTML templates
    ├── index.html
    ├── predict.html
    └── result.html
```

## 8. Machine Learning Pipeline
1.  **Data Loading**: Reads `student_data_expanded_5000.csv`.
2.  **Feature Selection**: Keeps 10 critical predictors (studytime, failures, absences, higher, internet, schoolsup, health, famrel, G1, G2).
3.  **Encoding**: Maps binary categorical columns (`yes`/`no`) to `1`/`0`.
4.  **Scaling**: Fits a `StandardScaler` to normalize the input features.
5.  **Training**: Trains a `RandomForestRegressor` with optimized hyperparameters (n_estimators=200, max_depth=5).
6.  **Export**: Saves the trained model (`student_model.pkl`) and scaler (`scaler.pkl`) using `joblib`.

## 9. Dataset Information
The dataset tracks student performance and demographic information. 
Key features used in the model:
*   **G1 & G2**: First and second period grades (numeric: 0-20).
*   **studytime**: Weekly study time (numeric: 1-4).
*   **failures**: Number of past class failures (numeric).
*   **absences**: Number of school absences (numeric).
*   **health & famrel**: Health status and family relationship quality (numeric: 1-5).
*   **higher, internet, schoolsup**: Categorical yes/no flags for higher education aspirations, internet access, and extra school support.
*   **G3 (Target)**: Final grade (numeric: 0-20).

## 10. Model Information
*   **Algorithm**: Random Forest Regressor
*   **Hyperparameters**: `n_estimators=200`, `max_depth=5`, `min_samples_split=5`, `min_samples_leaf=1`.
*   **Optimization**: Hyperparameters were selected to prevent overfitting while maintaining high predictive accuracy (low Mean Absolute Error and high R2 Score).

## 11. How the Prediction System Works
1.  The user fills out the form on the frontend UI.
2.  The JS script intercepts the submission and sends a JSON payload via `POST` to `/predict`.
3.  The Flask backend validates the data types and bounds.
4.  The data is converted into a Pandas DataFrame, categorical variables are mapped to 1/0, and the data is scaled using the pre-loaded `scaler.pkl`.
5.  The `student_model.pkl` predicts the final grade.
6.  The backend computes class averages, feature impacts, what-if scenarios, and personalized advice based on the input metrics.
7.  A comprehensive JSON response is returned and rendered beautifully on the result page.

## 12. Installation Instructions
Ensure you have Python 3.8+ installed on your system. You will need `git` to clone the repository.

## 13. Creating a Virtual Environment
It is highly recommended to use a virtual environment to avoid dependency conflicts.

## 14. Installing Dependencies
All required Python libraries are listed in `requirements.txt`.

## 15. Running the Application
The main application runs using the Flask built-in server.

## 16. Accessing the Application in the Browser
Once the server is running, the application will be hosted locally on port 5000.

## 17. Expected Outputs
When you navigate to the application, you will see a clean, modern landing page. After filling out the prediction form, you will be directed to the results page, which will display:
*   A predicted final grade and percentage.
*   A colored grade band (Excellent, Average, Needs Improvement).
*   Personalized, bulleted advice based on your inputs.
*   Interactive radar charts and what-if analysis showing how changing study time or absences affects the grade.

## 18. Troubleshooting
*   **`ModuleNotFoundError`**: Ensure you have activated your virtual environment and run `pip install -r requirements.txt`.
*   **`FileNotFoundError: Dataset not found`**: Ensure you are running the scripts from the root directory of the project.
*   **Port 5000 is in use**: If another application is using port 5000, you can change the port in `app.py` by modifying `app.run(debug=True, port=5001)`.

## 19. Future Improvements
*   Deploy the application to a cloud platform (e.g., Heroku, AWS, Render).
*   Replace the CSV dataset with a relational database (e.g., PostgreSQL or SQLite) to store predictions and user feedback.
*   Implement user authentication so students can track their grades and predictions over time.
*   Add classification models to predict pass/fail binary outcomes directly.

## 20. Author Information
Developed as a Machine Learning Web Application Project.

---

### Clone and Run

```bash
git clone <repository-url>
cd <repository-name>

python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

python app.py
```
