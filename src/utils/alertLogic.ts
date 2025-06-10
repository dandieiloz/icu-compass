// src/utils/alertLogic.ts
import type { CnsData, Alert } from '../types/database';

export function generateAlerts(data: CnsData, previousGcsTotal?: number): Alert[] {
  const newAlerts: Alert[] = [];
  const gcsTotal = data.gcs?.total || 0;

  // GCS Alerts
  if (gcsTotal <= 8 && gcsTotal > 0) newAlerts.push({ type: 'Critical', message: 'GCS ≤ 8 (Severe).' });
  if (previousGcsTotal && gcsTotal < previousGcsTotal - 1) newAlerts.push({ type: 'Warning', message: `GCS dropped by ${previousGcsTotal - gcsTotal} or more points.` });

  // Pupil Alert
  if (data.pupils?.asymmetry === 'Yes' || data.pupils?.lightReactionLeft === 'Non-reactive' || data.pupils?.lightReactionRight === 'Non-reactive') {
    newAlerts.push({ type: 'Critical', message: 'Pupil asymmetry or non-reactive pupils detected.' });
  }

  // Systemic Parameter Alerts
  if (data.systemicParameters?.sbp === '<90 mmHg') newAlerts.push({ type: 'Critical', message: 'SBP < 90 mmHg (Hypotension).' });
  if (data.systemicParameters?.sao2 === '<90%') newAlerts.push({ type: 'Critical', message: 'SaO₂ < 90% (Hypoxia).' });
  if (data.systemicParameters?.glucose?.toString().includes('<70') || data.systemicParameters?.glucose?.toString().includes('>180')) newAlerts.push({ type: 'Warning', message: 'Glucose outside target range (70-180 mg/dL).' });
  if (data.systemicParameters?.temperature?.toString().includes('<36') || data.systemicParameters?.temperature?.toString().includes('>38')) newAlerts.push({ type: 'Warning', message: 'Hypothermia or fever detected.' });

  // ICP & CPP Alerts
  if (data.icp?.value === '>20 mmHg') newAlerts.push({ type: 'Critical', message: 'ICP > 20 mmHg (Elevated ICP).' });
  if (data.cpp && data.cpp < 50) newAlerts.push({ type: 'Critical', message: `CPP < 50 mmHg (Low perfusion).` });

  // Cerebral O2 Alerts
  if (data.cerebralOxygenation?.pbto2?.toString().includes('<10')) newAlerts.push({ type: 'Critical', message: 'PbtO₂ < 10 mmHg (Ischemia risk).' });
  if (data.cerebralOxygenation?.sjvo2?.toString().includes('<50') || data.cerebralOxygenation?.sjvo2?.toString().includes('>75')) newAlerts.push({ type: 'Warning', message: 'SjvO₂ outside 50-75% range (Ischemia/Hyperemia).' });

  // Delirium & EEG Alerts
  if (data.delirium?.result === 'Positive delirium screen') newAlerts.push({ type: 'Warning', message: 'Positive delirium screen indicates PICS risk.' });
  if (data.eeg?.status === 'Seizure activity detected') newAlerts.push({ type: 'Critical', message: 'Seizure activity detected on EEG.' });

  return newAlerts;
}