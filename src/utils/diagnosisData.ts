// src/utils/diagnosisData.ts
export const DIAGNOSIS_DATA: { [category: string]: string[] } = {
  "Cardiovascular": [
    "Acute Coronary Syndrome",
    "Cardiogenic Shock",
    "Congestive Heart Failure",
    "Arrhythmia",
    "Hypertensive Emergency",
    "Pulmonary Embolism"
  ],
  "Respiratory": [
    "ARDS",
    "Pneumonia",
    "COPD Exacerbation",
    "Asthma Exacerbation",
    "Respiratory Failure"
  ],
  "Neurology": [
    "Ischemic Stroke",
    "Hemorrhagic Stroke",
    "Seizure",
    "Meningitis/Encephalitis",
    "Traumatic Brain Injury"
  ],
  "Gastrointestinal": [
    "GI Bleed",
    "Pancreatitis",
    "Liver Failure",
    "Bowel Obstruction"
  ],
  "Renal": [
    "Acute Kidney Injury (AKI)",
    "End-Stage Renal Disease (ESRD)"
  ],
  "Endocrine": [
    "Diabetic Ketoacidosis (DKA)",
    "Hyperosmolar Hyperglycemic State (HHS)",
    "Adrenal Insufficiency"
  ],
  "Infectious Disease": [
    "Sepsis",
    "Septic Shock"
  ],
  "Hematology/Oncology": [
    "Anemia",
    "Thrombocytopenia",
    "Tumor Lysis Syndrome"
  ]
};