import React, { useState } from 'react'; // Removed useMemo, it's no longer needed
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Patient } from '../types/database';
import Modal from './Modal';
import { DiagnosisSelector } from './DiagnosisSelector';
import { DIAGNOSIS_DATA } from '../utils/diagnosisData';
import { CustomDatalist } from './CustomDatalist';

interface PatientHistoryProps {
  patient: Patient;
  onUpdate: () => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ patient, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableDiagnosis, setEditableDiagnosis] = useState('');
  const [editableHistory, setEditableHistory] = useState<string[]>([]);
  const [editableProblems, setEditableProblems] = useState<string[]>([]);

  // REMOVED: This line was incorrect and is no longer needed.
  // const allDiagnoses = useMemo(() => Object.values(DIAGNOSIS_DATA).flat(), []);

  const openEditModal = () => {
    setEditableDiagnosis(patient.primaryDiagnosis || '');
    setEditableHistory(patient.pastMedicalHistory || []);
    setEditableProblems(patient.activeProblems || []);
    setIsModalOpen(true);
  }

  const handleSaveChanges = async () => {
    const patientDocRef = doc(db, 'patients', patient.id);
    try {
      await updateDoc(patientDocRef, {
        primaryDiagnosis: editableDiagnosis,
        pastMedicalHistory: editableHistory,
        activeProblems: editableProblems,
      });
      alert('Patient info updated.');
      onUpdate();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating patient info: ", error);
      alert('Failed to update.');
    }
  };

  return (
    <div className="patient-history">
      <h4>Patient Overview</h4>
      <p><strong>Primary Diagnosis:</strong> {patient.primaryDiagnosis}</p>
      <div>
        <strong>Past Medical History:</strong>
        <ul>
          {patient.pastMedicalHistory?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
      <div>
        <strong>Active Problems:</strong>
        <ul>
          {patient.activeProblems?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
      <button onClick={openEditModal}>Edit History & Problems</button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Edit Patient Info</h3>

        <fieldset>
            <legend>Primary Diagnosis</legend>
            <CustomDatalist
              name="primaryDiagnosis"
              placeholder="Search diagnosis or enter manually..."
              // UPDATED: Pass the categorized object directly
              suggestions={DIAGNOSIS_DATA}
              value={editableDiagnosis}
              onChange={(e) => setEditableDiagnosis(e.target.value)}
            />
        </fieldset>

        <div className="selectors-container">
          <DiagnosisSelector
            title="Past Medical History"
            diagnosisData={DIAGNOSIS_DATA}
            selectedItems={editableHistory}
            onSelectionChange={setEditableHistory}
          />
          <DiagnosisSelector
            title="Active Problems"
            diagnosisData={DIAGNOSIS_DATA}
            selectedItems={editableProblems}
            onSelectionChange={setEditableProblems}
          />
        </div>
        <button onClick={handleSaveChanges}>Save Changes</button>
      </Modal>
    </div>
  );
};