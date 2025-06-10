import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WardDashboard } from './pages/WardDashboard';
import { PatientDetail } from './pages/PatientDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<WardDashboard />} />
          <Route path="/patient/:bedId" element={<PatientDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;