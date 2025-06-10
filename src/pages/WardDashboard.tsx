import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth'; // Correct type-only import
import type { Patient } from '../types/database';

const BEDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9','A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Update the component to accept the user prop
export const WardDashboard = ({ user }: { user: User | null }) => {
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
      await setDoc(newPatientRef, { primaryDiagnosis: "New Patient", activeProblems: [], pastMedicalHistory: [] });
      fetchPatients();
    } catch (error) {
      console.error("Error adding patient: ", error);
    }
  };
  
  const handleSignOut = () => {
    signOut(getAuth());
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const patientMap = useMemo(() => new Map(patients.map(p => [p.id, p])), [patients]);

  if (isLoading) {
    return <div>Loading from Firestore...</div>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>ICU Compass</h1>
        {user && <button onClick={handleSignOut} className="logout-button">Sign Out ({user.email})</button>}
      </div>
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