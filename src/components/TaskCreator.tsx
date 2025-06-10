import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Modal from './Modal';

export const COMMON_TASKS: { [category: string]: string[] } = {
    "Imaging": [
        "Chest X-Ray (CXR)",
        "CT Head",
        "CT Chest/Abdomen/Pelvis",
        "Ultrasound (Bedside)",
        "MRI Brain"
    ],
    "Procedures": [
        "Central Line Insertion",
        "Arterial Line Placement",
        "Intubation / Reintubation",
        "Tracheostomy",
        "Chest Tube Insertion",
        "Paracentesis",
        "Thoracentesis",
        "Bronchoscopy"
    ],
    "Cardiopulmonary": [
        "Bedside Echocardiography",
        "ECG / Telemetry Review",
        "External Pacing",
        "Defibrillation/Cardioversion"
    ],
    "Renal & Metabolic": [
        "Hemodialysis",
        "Continuous Renal Replacement Therapy (CRRT)",
        "Daily Electrolyte Review",
        "Glucose Management"
    ],
    "Infectious Workup": [
        "Blood Cultures",
        "Sputum Culture",
        "Urine Culture",
        "Lumbar Puncture"
    ],
    "Administrative": [
        "Family Meeting",
        "Goals of Care Discussion",
        "Daily Plan Review",
        "Transfer to Ward",
        "Consultation Request"
    ]
};

interface TaskCreatorProps {
  bedId: string;
  onTaskAdded: () => void;
}

export const TaskCreator: React.FC<TaskCreatorProps> = ({ bedId, onTaskAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleTaskSelect = (task: string) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAddTask = async () => {
    if (!bedId || !selectedTask.trim()) return;
    try {
      const tasksColRef = collection(db, 'patients', bedId, 'tasks');
      const taskText = selectedTask === 'Other' && notes ? notes.split('\n')[0] : selectedTask;
      
      const newTask = {
        text: taskText,
        notes: notes,
        isDone: false,
        createdAt: serverTimestamp()
      };
      
      await addDoc(tasksColRef, newTask);
      onTaskAdded(); // Notify parent to refetch
      closeModal();
    } catch (error) {
      console.error("Error adding task: ", error);
      alert('Failed to add task.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask('');
    setNotes('');
  };

  const filteredTasks = Object.keys(COMMON_TASKS).reduce((acc, category) => {
    const filtered = COMMON_TASKS[category].filter(task =>
      task.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as { [category: string]: string[] });

  return (
    <div className="task-creator">
      <h4>Add a New Task</h4>
      
      {/* "Other" button is now prominent at the top */}
      <button onClick={() => handleTaskSelect('Other')} className="task-button other-task-button">
        Add Custom/Other Task
      </button>

      <input
        type="text"
        placeholder="Search for a task..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="task-selection-list">
        {Object.entries(filteredTasks).map(([category, tasks]) => (
          <div key={category} className="task-category-group">
            <h5>{category}</h5>
            <ul>
              {tasks.map(task => (
                <li key={task} onClick={() => handleTaskSelect(task)}>
                  {task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h3>Add Task: {selectedTask}</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={selectedTask === 'Other' ? 'Describe the custom task...' : 'Add optional notes or comments...'}
          rows={4}
        />
        <button onClick={handleAddTask}>Confirm and Add Task</button>
      </Modal>
    </div>
  );
};