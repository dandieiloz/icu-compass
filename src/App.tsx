import { useState, useEffect } from 'react'; // Values
import type { ReactNode } from 'react';      // Types
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { WardDashboard } from './pages/WardDashboard';
import { PatientDetail } from './pages/PatientDetail';
import { LoginPage } from './pages/LoginPage';
import './App.css';

// A simple component to protect routes
const ProtectedRoute = ({ user, children }: { user: User | null, children: ReactNode }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (authLoading) {
    return <div>Loading Application...</div>;
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute user={user}>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute user={user}>
                <WardDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/:bedId" 
            element={
              <ProtectedRoute user={user}>
                <PatientDetail />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Helper component for redirecting logged-in users
const PublicRoute = ({ user, children }: { user: User | null, children: ReactNode }) => {
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default App;