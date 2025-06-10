import React, { useEffect, useState, useReducer } from 'react';
import { httpsCallable } from "firebase/functions";
import { useParams, Link } from 'react-router-dom';
import { 
  doc, getDoc, setDoc, collection, getDocs, 
  orderBy, query, addDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db, functions } from '../firebaseConfig';
// REMOVED: CnsData is no longer needed in this file if it was only for the wizard
import type { Patient, FollowUp, Task, Medication } from '../types/database'; 
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import FollowUpCard from '../components/FollowUpCard';
import Modal from '../components/Modal';
// REMOVED: Import for CnsFollowUpWizard
// import CnsFollowUpWizard from '../components/CnsFollowUpWizard'; 

const formReducer = (state: any, event: { name: string; value: any }) => {
  if (event.name === 'reset') {
    return {};
  }
  return { ...state, [event.name]: event.value };
};

export const PatientDetail = () => {
  const { bedId } = useParams<{ bedId: string }>();

  // STATE MANAGEMENT
  const [patient, setPatient] = useState<Patient | null>(null);
  const [pastFollowUps, setPastFollowUps] = useState<FollowUp[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newMed, setNewMed] = useState({ name: '', dose: '', frequency: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useReducer(formReducer, {});
  
  // REMOVED: State for CNS modal and data
  // const [isCnsModalOpen, setIsCnsModalOpen] = useState(false); 
  // const [cnsData, setCnsData] = useState<CnsData | {}>({}); 

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ name: event.target.name, value: event.target.value });
  };
  
  useEffect(() => {
    if (!bedId) return;
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const patientDocRef = doc(db, 'patients', bedId);
        const patientDocSnap = await getDoc(patientDocRef);
        if (patientDocSnap.exists()) {
          setPatient({ id: patientDocSnap.id, ...patientDocSnap.data() } as Patient);
        } else {
          setError("Patient not found.");
          setIsLoading(false);
          return;
        }
        
        const followUpsColRef = collection(db, 'patients', bedId, 'followups');
        const followUpsQuery = query(followUpsColRef, orderBy('createdAt', 'desc'));
        const followUpsSnapshot = await getDocs(followUpsQuery);
        setPastFollowUps(followUpsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FollowUp)));
        
        const tasksColRef = collection(db, 'patients', bedId, 'tasks');
        const tasksQuery = query(tasksColRef, orderBy('createdAt', 'desc'));
        const tasksSnapshot = await getDocs(tasksQuery);
        setTasks(tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));

        const medsColRef = collection(db, 'patients', bedId, 'medications');
        const medsSnapshot = await getDocs(medsColRef);
        setMedications(medsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medication)));

      } catch (err) {
        console.log(err);
        setError("Failed to fetch data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [bedId]);

  // REMOVED: Handler function for saving data from the CNS modal
  // const handleCnsSave = ...

  // HANDLER FUNCTIONS
  const handleSaveFollowUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bedId) return;

    const followUpData: { [key: string]: any } = {
        notes: formData.notes || '',
        createdAt: serverTimestamp(),
    };

    // Add other systems from the simple form if they exist
    const otherSystems: {[key: string]: any} = {};
    for (const key in formData) {
        if (key.includes('_')) {
            const [system, property] = key.split('_');
            if (!otherSystems[system]) otherSystems[system] = {};
            otherSystems[system][property] = formData[key];
        }
    }
    Object.assign(followUpData, otherSystems);

    const today = new Date().toISOString().split('T')[0];
    const followUpDocRef = doc(db, 'patients', bedId, 'followups', today);
    try {
      await setDoc(followUpDocRef, followUpData, { merge: true });
      alert('Follow-up saved!');
      const newFollowUp = { id: today, ...followUpData, createdAt: new Date() } as FollowUp;
      setPastFollowUps(prev => [newFollowUp, ...prev.filter(fu => fu.id !== today)].sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime()));
      setFormData({ name: 'reset', value: {} });
    } catch (error) {
      console.error("Error saving follow-up: ", error);
      alert('Failed to save.');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedId || !newTaskText.trim()) return;
    try {
      const tasksColRef = collection(db, 'patients', bedId, 'tasks');
      const newTaskData = { text: newTaskText, isDone: false, createdAt: serverTimestamp() };
      const docRef = await addDoc(tasksColRef, newTaskData);
      setTasks(prev => [{ id: docRef.id, ...newTaskData, createdAt: new Date() }, ...prev]);
      setNewTaskText('');
    } catch (error) { console.error("Error adding task: ", error); }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!bedId) return;
    const taskDocRef = doc(db, 'patients', bedId, 'tasks', taskId);
    try {
      await updateDoc(taskDocRef, { isDone: !currentStatus });
      setTasks(tasks.map(task => task.id === taskId ? { ...task, isDone: !currentStatus } : task));
    } catch (error) { console.error("Error updating task: ", error); }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedId || !newMed.name.trim()) return;
    try {
      const medsColRef = collection(db, 'patients', bedId, 'medications');
      const docRef = await addDoc(medsColRef, newMed);
      setMedications(prev => [{ id: docRef.id, ...newMed }, ...prev]);
      setNewMed({ name: '', dose: '', frequency: '' });
    } catch (error) { console.error("Error adding medication: ", error); }
  };

  const handleDeleteMedication = async (medId: string) => {
    if (!bedId || !window.confirm("Are you sure?")) return;
    try {
      const medDocRef = doc(db, 'patients', bedId, 'medications', medId);
      await deleteDoc(medDocRef);
      setMedications(medications.filter(med => med.id !== medId));
    } catch (error) { console.error("Error deleting medication: ", error); }
  };

  const handleGenerateSummary = async (followUpId: string) => {
    if (!bedId) return;
    setIsAiLoading(true);
    const generateSummaryCallable = httpsCallable(functions, 'generateSummary');
    try {
        const result = await generateSummaryCallable({ patientId: bedId, followUpId: followUpId });
        const summary = (result.data as { summary: string }).summary;
        setPastFollowUps(pastFollowUps.map(fu =>
            fu.id === followUpId ? { ...fu, aiSummary: summary } : fu
        ));
    } catch (error) {
        console.error("Cloud function error:", error);
        alert("Failed to generate summary.");
    } finally {
        setIsAiLoading(false);
    }
  };

  if (isLoading) return <div>Loading patient data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Link to="/">&larr; Back to Dashboard</Link>
      <h1>Bed: {patient?.id}</h1>
      <p><strong>Primary Diagnosis:</strong> {patient?.primaryDiagnosis}</p>
      
      <Tabs>
        <TabList>
          <Tab>Daily Follow-up</Tab>
          <Tab>Tasks</Tab>
          <Tab>Medications</Tab>
        </TabList>

        <TabPanel>
          <form onSubmit={handleSaveFollowUp} className="follow-up-form">
            <h3>Today's Follow-up ({new Date().toLocaleDateString()})</h3>
            
            {/* REMOVED: Button and Modal for CNS Details */}

            <h4>Cardiovascular (CV)</h4>
            <input name="cv_hr" value={formData.cv_hr || ''} onChange={handleFormChange} placeholder="Heart Rate" />
            <input name="cv_bp" value={formData.cv_bp || ''} onChange={handleFormChange} placeholder="Blood Pressure" />
            <h4>Respiratory</h4>
            <input name="respi_mode" value={formData.respi_mode || ''} onChange={handleFormChange} placeholder="Ventilator Mode" />
            <input name="respi_fio2" value={formData.respi_fio2 || ''} onChange={handleFormChange} placeholder="FiO2 (%)" />
            <h4>Notes</h4>
            <textarea name="notes" value={formData.notes || ''} onChange={handleFormChange} placeholder="Overall plan and notes..."></textarea>
            <button type="submit">Save Today's Follow-up</button>
          </form>
          <hr />
          <div className="past-follow-ups">
            <h3>Past Follow-ups</h3>
            {pastFollowUps.length > 0 ? (
              pastFollowUps.map(fu => (
                <FollowUpCard key={fu.id} followUp={fu} onGenerateSummary={() => handleGenerateSummary(fu.id)} isAiLoading={isAiLoading} />
              ))
            ) : (
              <p>No past follow-ups found.</p>
            )}
          </div>
        </TabPanel>

        <TabPanel>
          <div className="tasks-section">
            <h3>Tasks</h3>
            <form onSubmit={handleAddTask} className="task-form">
              <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Add a new task..." />
              <button type="submit">Add Task</button>
            </form>
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task.id} className={task.isDone ? 'completed' : ''}>
                  <input type="checkbox" checked={task.isDone} onChange={() => handleToggleTask(task.id, task.isDone)} />
                  <span>{task.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="medications-section">
            <h3>Medications</h3>
            <form onSubmit={handleAddMedication} className="med-form">
              <input value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} placeholder="Medication Name" />
              <input value={newMed.dose} onChange={(e) => setNewMed({...newMed, dose: e.target.value})} placeholder="Dose" />
              <input value={newMed.frequency} onChange={(e) => setNewMed({...newMed, frequency: e.target.value})} placeholder="Frequency" />
              <button type="submit">Add Medication</button>
            </form>
            <div className="medication-list">
              {medications.map(med => (
                <div key={med.id} className="medication-item">
                  <span><strong>{med.name}</strong> - {med.dose} - {med.frequency}</span>
                  <button onClick={() => handleDeleteMedication(med.id)} className="delete-button">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};