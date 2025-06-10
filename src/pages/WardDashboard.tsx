// Recommended location: src/pages/WardDashboard.tsx

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { type Patient } from '../types/database';
import { Link } from 'react-router-dom';

const BEDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9','A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const WardDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const patientsCollectionRef = collection(db, 'patients');
      const querySnapshot = await getDocs(patientsCollectionRef);
      const patientList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      setPatients(patientList);
    } catch (error) {
      console.error("Error fetching patients: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPatient = async (bedId: string) => {
    try {
      const newPatientRef = doc(db, 'patients', bedId);
      await setDoc(newPatientRef, { primaryDiagnosis: "New Patient" });
      fetchPatients(); // Re-fetch the list to ensure consistency
    } catch (error) {
      console.error("Error adding patient: ", error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Use a Map for efficient O(1) patient lookups in the render function
  const patientMap = useMemo(() => new Map(patients.map(p => [p.id, p])), [patients]);

  if (isLoading) {
    return <div>Loading from Firestore...</div>;
  }

  return (
    <div>
      <h1>ICU Compass</h1>
      <div className="bed-list">
        {BEDS.map(bedId => {
          const patient = patientMap.get(bedId);
          return (
            <Link to={`/patient/${bedId}`} key={bedId} className="bed-card-link">
              <div className="bed-card">
                <h2>Bed: {bedId}</h2>
                {patient ? (
                  <p>{patient.primaryDiagnosis}</p>
                ) : (
                  <button onClick={(e) => {
                    e.preventDefault(); 
                    addPatient(bedId);
                  }}>+</button>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};