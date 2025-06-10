// src/types/database.ts

export interface GCS {
  eyeOpening: number;
  verbalResponse: number;
  motorResponse: number;
  total: number;
}

export interface CnsData {
  gcs?: Partial<GCS>;
  pupils?: { [key: string]: string };
  motorFunction?: { [key: string]: string };
  systemicParameters?: { [key: string]: string | number };
  icp?: { [key: string]: string };
  cpp?: number;
  cerebralOxygenation?: { [key: string]: string };
  eeg?: { [key: string]: string };
  csf?: { [key: string]: string | boolean };
  delirium?: { [key: string]: string };
  brainDeath?: { [key: string]: string };
}

export interface Alert {
  type: 'Critical' | 'Warning';
  message: string;
}