import React, { useEffect, useState, useCallback, useReducer } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { 
  doc, getDoc, setDoc, collection, getDocs, 
  orderBy, query, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db, functions } from '../firebaseConfig';
import type { Patient, FollowUp, Task, Medication } from '../types/database';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import FollowUpCard from '../components/FollowUpCard';
import { FollowUpForm } from '../components/FollowUpForm';
import { TaskCreator } from '../components/TaskCreator';
import { PatientHistory } from '../components/PatientHistory';
import { MedicationManager } from '../components/MedicationManager';
import Modal from '../components/Modal';

// Reducer for the follow-up form state
const formReducer = (state: any, action: { type: string, name?: string, value?: any }) => {
  switch (action.type) {
    case 'change':
      return { ...state, [action.name!]: action.value };
    case 'populate':
      return { ...action.value };
    case 'reset':
      return {};
    default:
      return state;
  }
};

export const PatientDetail = () => {
  const { bedId } = useParams<{ bedId: string }>();
  const navigate = useNavigate();

  // Component State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [pastFollowUps, setPastFollowUps] = useState<FollowUp[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Follow-up Form State
  const [followUpData, dispatchFollowUpData] = useReducer(formReducer, {});
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal and Action States
  const [isDischarging, setIsDischarging] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (!bedId) return;
    if (isInitialLoad) setIsLoading(true);
    
    try {
      const patientDocRef = doc(db, 'patients', bedId);
      const patientDocSnap = await getDoc(patientDocRef);
      const fetchedPatient = patientDocSnap.exists() ? { id: patientDocSnap.id, ...patientDocSnap.data() } as Patient : null;
      setPatient(fetchedPatient);
      
      const followUpsQuery = query(collection(db, 'patients', bedId, 'followups'), orderBy('createdAt', 'desc'));
      const followUpsSnapshot = await getDocs(followUpsQuery);
      const fetchedFollowUps = followUpsSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as FollowUp));
      setPastFollowUps(fetchedFollowUps);
      
      const tasksQuery = query(collection(db, 'patients', bedId, 'tasks'), orderBy('createdAt', 'desc'));
      const tasksSnapshot = await getDocs(tasksQuery);
      setTasks(tasksSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Task)));
      
      const medsColRef = collection(db, 'patients', bedId, 'medications');
      const medsSnapshot = await getDocs(medsColRef);
      setMedications(medsSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Medication)));
      
      if (isInitialLoad) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayFollowUp = fetchedFollowUps.find(fu => fu.id === todayStr);
        if (todayFollowUp) {
          const { snapshot, createdAt, ...formData } = todayFollowUp; 
          dispatchFollowUpData({ type: 'populate', value: formData });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [bedId]);

  useEffect(() => {
    fetchAllData(true);
  }, [bedId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleFollowUpInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsFormDirty(true);
    dispatchFollowUpData({ type: 'change', name: e.target.name, value: e.target.value });
  };
  
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !bedId) return;
    setIsSaving(true);
    const dataToSave = {
      ...followUpData,
      createdAt: serverTimestamp(),
      snapshot: {
        tasks,
        medications,
        patientOverview: {
          primaryDiagnosis: patient.primaryDiagnosis,
          pastMedicalHistory: patient.pastMedicalHistory,
          activeProblems: patient.activeProblems,
        }
      }
    };
    const today = new Date().toISOString().split('T')[0];
    const followUpDocRef = doc(db, 'patients', bedId, 'followups', today);
    try {
      await setDoc(followUpDocRef, dataToSave, { merge: true });
      alert('Follow-up saved!');
      setIsFormDirty(false);
      fetchAllData();
    } catch (error) {
      console.error("Error saving follow-up: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!bedId) return;
    const taskDocRef = doc(db, 'patients', bedId, 'tasks', taskId);
    await updateDoc(taskDocRef, { isDone: !currentStatus });
    fetchAllData();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!bedId || !window.confirm("Are you sure?")) return;
    const taskDocRef = doc(db, 'patients', bedId, 'tasks', taskId);
    await deleteDoc(taskDocRef);
    fetchAllData();
  };
  
  const handleDischarge = async () => {
    if (!bedId) return;
    if (isFormDirty && !window.confirm("You have unsaved changes that will be lost. Are you sure you want to discharge this patient?")) return;
    
    const confirmation = window.prompt(`To confirm discharge for Bed ${bedId}, type "DISCHARGE".`);
    if (confirmation !== "DISCHARGE") return;

    setIsDischarging(true);
    const dischargePatientCallable = httpsCallable(functions, 'dischargePatient');
    try {
      await dischargePatientCallable({ bedId });
      alert(`Patient in bed ${bedId} discharged.`);
      setIsFormDirty(false);
      navigate('/');
    } catch (error) {
      console.error("Discharge failed:", error);
      setIsDischarging(false);
    }
  };

  const handleViewFollowUp = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setIsFollowUpModalOpen(true);
  };
  
  const handleCopyToClipboard = async (followUp: FollowUp | null) => {
    if (!followUp) {
      alert("No follow-up data available to copy.");
      return;
    }

    let clipboardText = `--- ICU COMPASS SNAPSHOT: ${followUp.id} ---\n\n`;

    if (followUp.snapshot) {
      const { patientOverview, medications, tasks } = followUp.snapshot;
      clipboardText += `[PATIENT OVERVIEW]\n`;
      clipboardText += `Primary Diagnosis: ${patientOverview.primaryDiagnosis}\n`;
      clipboardText += `Past Medical History: ${patientOverview.pastMedicalHistory.join(', ') || 'None'}\n`;
      clipboardText += `Active Problems: ${patientOverview.activeProblems.join(', ') || 'None'}\n\n`;
      clipboardText += `[ACTIVE MEDICATIONS]\n`;
      clipboardText += `${medications.length > 0 ? medications.map(med => `- ${med.name} ${med.dose} ${med.route} ${med.frequency}`).join('\n') : 'None'}\n\n`;
      clipboardText += `[ACTIVE TASKS]\n`;
      clipboardText += `${tasks.filter(t => !t.isDone).length > 0 ? tasks.filter(t => !t.isDone).map(task => `- ${task.text}`).join('\n') : 'None'}\n\n`;
    }

    clipboardText += `--- DAILY SYSTEM NOTES ---\n\n`;
    const excludedKeys = ['id', 'createdAt', 'snapshot', 'aiSummary', 'notes'];
    for (const [key, value] of Object.entries(followUp)) {
        if (!excludedKeys.includes(key) && typeof value === 'string' && value.trim()) {
            clipboardText += `[${key.toUpperCase()}]\n${value}\n\n`;
        }
    }
    if (followUp.notes) {
        clipboardText += `[GENERAL NOTES]\n${followUp.notes}\n\n`;
    }
    
    clipboardText += `What would be the daily management for this patient, what could be potential complications and what to look for and how`;

    try {
        await navigator.clipboard.writeText(clipboardText);
        
        // NEW: Open the specified URL in a new tab after copying
        window.open('https://notebooklm.google.com/notebook/9261afd4-97f5-4913-bd88-b654205cb963', '_blank');

        alert("Patient summary copied to clipboard! Your notebook is opening in a new tab.");

    } catch (err) {
        console.error("Failed to copy or open window: ", err);
        alert("Could not copy to clipboard.");
    }
  };

  if (isLoading) return <div>Loading patient data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!patient) return <div>Patient data could not be loaded.</div>;

  return (
    <div>
      <Link 
        to="/"
        onClick={(e) => {
          if (isFormDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
            e.preventDefault();
          }
        }}
      >
        &larr; Back to Dashboard
      </Link>
      <div className="patient-header">
        <h1>Bed: {patient.id}</h1>
        <button onClick={handleDischarge} className="discharge-button" disabled={isDischarging}>
            {isDischarging ? 'Discharging...' : 'Discharge Patient'}
        </button>
      </div>
      
      <PatientHistory patient={patient} onUpdate={fetchAllData} />
      <hr/>
      
      <Tabs>
        <TabList>
          <Tab>Daily Follow-up</Tab>
          <Tab>Tasks</Tab>
          <Tab>Medications</Tab>
        </TabList>

        <TabPanel>
          <FollowUpForm 
              formData={followUpData}
              handleInputChange={handleFollowUpInputChange}
              handleSave={handleSaveFollowUp}
              isSaving={isSaving}
          />
          <hr />
          <h3>Past Follow-ups</h3>
          <div className="past-follow-ups">
            {pastFollowUps.map(fu => (
              <FollowUpCard key={fu.id} followUp={fu} onClick={() => handleViewFollowUp(fu)} />
            ))}
          </div>
        </TabPanel>

        <TabPanel>
          <TaskCreator bedId={patient.id} onTaskAdded={fetchAllData} />
          <hr/>
          <h3>Task List</h3>
          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} className={task.isDone ? 'completed' : ''}>
                <div>
                  <input type="checkbox" checked={task.isDone} onChange={() => handleToggleTask(task.id, task.isDone)} />
                  <span>{task.text} {task.notes && <em style={{color: 'grey'}}>({task.notes})</em>}</span>
                </div>
                <button onClick={() => handleDeleteTask(task.id)} className="delete-button">Delete</button>
              </li>
            ))}
          </ul>
        </TabPanel>
        
        <TabPanel>
          <MedicationManager bedId={patient.id} />
        </TabPanel>
      </Tabs>

      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)}>
        {selectedFollowUp && (
          <div>
            <h3>Follow-up Details ({selectedFollowUp.id})</h3>
            <div className="snapshot-header">
                <h4>Patient Snapshot on This Day</h4>
                <button onClick={() => handleCopyToClipboard(selectedFollowUp)} className="copy-button">
                    Copy for Handoff
                </button>
            </div>
            {selectedFollowUp.snapshot && (
              <div className="snapshot-view">
                <div className="system-summary">
                  <strong>Patient Overview</strong>
                  <ul>
                    <li><strong>Diagnosis:</strong> {selectedFollowUp.snapshot.patientOverview.primaryDiagnosis}</li>
                    <li><strong>PMH:</strong> {selectedFollowUp.snapshot.patientOverview.pastMedicalHistory.join(', ') || 'None'}</li>
                    <li><strong>Problems:</strong> {selectedFollowUp.snapshot.patientOverview.activeProblems.join(', ') || 'None'}</li>
                  </ul>
                </div>
                <div className="system-summary">
                  <strong>Active Medications</strong>
                  <ul>
                    {selectedFollowUp.snapshot.medications.length > 0 ? 
                      selectedFollowUp.snapshot.medications.map(med => <li key={med.id}>{med.name}</li>) : <li>None</li>}
                  </ul>
                </div>
                 <div className="system-summary">
                    <strong>Active Tasks</strong>
                    <ul>
                      {selectedFollowUp.snapshot.tasks.length > 0 ? 
                        selectedFollowUp.snapshot.tasks.map(task => <li key={task.id}>{task.text}</li>) : <li>None</li>}
                    </ul>
                </div>
              </div>
            )}
            <hr />
            <h4>Daily System Notes</h4>
            {Object.entries(selectedFollowUp).map(([key, value]) => {
              if (['id', 'createdAt', 'aiSummary', 'snapshot', 'notes'].includes(key)) return null;
              const systemNotes = String(value);
              if (systemNotes.trim() === '') return null;
              return (
                <div key={key} className="system-summary">
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</strong>
                  <p>{systemNotes}</p>
                </div>
              );
            })}
             {selectedFollowUp.notes && (
                <div className="system-summary">
                    <strong>General Notes</strong>
                    <p>{selectedFollowUp.notes}</p>
                </div>
             )}
          </div>
        )}
      </Modal>
    </div>
  );
};