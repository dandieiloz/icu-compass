import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Medication } from '../types/database';
import { CustomDatalist } from './CustomDatalist'; // <-- IMPORT THE NEW COMPONENT

export const ICU_MEDS: { [category: string]: string[] } = {
  "Vasopressors & Inotropes": [
    "Noradrenaline (Norepinephrine)",
    "Adrenaline (Epinephrine)",
    "Vasopressin",
    "Dopamine",
    "Dobutamine",
    "Phenylephrine"
  ],
  "Sedation & Analgesia": [
    "Midazolam",
    "Propofol",
    "Dexmedetomidine",
    "Fentanyl",
    "Morphine",
    "Ketamine"
  ],
  "Antibiotics & Antifungals": [
    "Meropenem",
    "Vancomycin",
    "Piperacillin-Tazobactam",
    "Linezolid",
    "Ceftriaxone",
    "Cefepime",
    "Fluconazole"
  ],
  "Diuretics & Fluid Management": [
    "Furosemide (Lasix)",
    "Mannitol",
    "Albumin 5%",
    "Albumin 20%"
  ],
  "Electrolytes & Metabolic": [
    "Insulin (Regular)",
    "Calcium Gluconate",
    "Magnesium Sulfate",
    "Potassium Chloride",
    "Sodium Bicarbonate",
    "Thiamine"
  ],
  "Other ICU Essentials": [
    "Heparin (unfractionated)",
    "Enoxaparin",
    "Tranexamic Acid",
    "Hydrocortisone",
    "Pantoprazole",
    "N-acetylcysteine (NAC)"
  ]
};

interface MedicationManagerProps {
  bedId: string;
}

export const MedicationManager: React.FC<MedicationManagerProps> = ({ bedId }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState({ name: '', dose: '', frequency: '', route: '' });

  const fetchMeds = useCallback(async () => {
    const medsColRef = collection(db, 'patients', bedId, 'medications');
    const q = query(medsColRef, orderBy('name'));
    const medsSnapshot = await getDocs(q);
    setMedications(medsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medication)));
  }, [bedId]);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name.trim()) {
      alert('Drug name is mandatory.');
      return;
    }
    try {
      const medsColRef = collection(db, 'patients', bedId, 'medications');
      await addDoc(medsColRef, newMed);
      setNewMed({ name: '', dose: '', frequency: '', route: '' });
      fetchMeds(); // Refetch to update the list
    } catch (error) {
      console.error("Error adding medication: ", error);
    }
  };

  const handleDeleteMedication = async (medId: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, 'patients', bedId, 'medications', medId));
      fetchMeds(); // Refetch
    } catch (error) {
      console.error("Error deleting medication: ", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMed({ ...newMed, [e.target.name]: e.target.value });
  };

  return (
    <div className="medications-section">
      <h3>Medications</h3>
      <form onSubmit={handleAddMedication} className="med-form">
        <CustomDatalist
          suggestions={ICU_MEDS}
          name="name"
          value={newMed.name}
          onChange={handleInputChange}
          placeholder="Drug Name (Mandatory)"
          required
        />
        <input name="dose" value={newMed.dose} onChange={handleInputChange} placeholder="Dose (optional)" />
        <input name="route" value={newMed.route} onChange={handleInputChange} placeholder="Route (optional)" />
        <input name="frequency" value={newMed.frequency} onChange={handleInputChange} placeholder="Frequency (optional)" />
        <button type="submit">Add Medication</button>
      </form>
      <div className="medication-list">
        {medications.map(med => (
          <div key={med.id} className="medication-item">
            <span><strong>{med.name}</strong> - {med.dose} {med.route} {med.frequency}</span>
            <button onClick={() => handleDeleteMedication(med.id)} className="delete-button">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};