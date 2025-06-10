import firebase from 'firebase/compat/app'; 
// Core data models
export interface Patient {
  id: string;
  primaryDiagnosis: string;
  pastMedicalHistory: string[];
  activeProblems: string[];
}
export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
}

export interface Task {
  id: string;
  text: string;
  isDone: boolean;
  createdAt: firebase.firestore.Timestamp | Date;
  notes?: string;
}

export interface FollowUp {
  id: string;
  createdAt: any; 
  notes?: string;
  aiSummary?: string;
  // System-specific notes
  cns?: string;
  cv?: string;
  respiratory?: string;
  fluidKidney?: string;
  giLiver?: string;
  hematology?: string;
  infectious?: string;
  skin?: string;
  catheters?: string;
  procedures?: string;
  
  // Snapshot of patient state at the time of follow-up
  snapshot?: {
    tasks: Task[];
    medications: Medication[];
    patientOverview: {
      primaryDiagnosis: string;
      pastMedicalHistory: string[];
      activeProblems: string[];
    }
  }
}