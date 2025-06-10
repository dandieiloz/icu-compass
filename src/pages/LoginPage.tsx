import React, { useState } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

export const LoginPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On success, the onAuthStateChanged listener in App.tsx will handle navigation.
    } catch (err: any) {
      setError(err.message);
      console.error("Authentication error:", err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>ICU Compass</h1>
      <p>{isLoginView ? 'Please sign in to continue' : 'Create an account'}</p>
      
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Loading...' : (isLoginView ? 'Login' : 'Sign Up')}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
      
      <button onClick={() => setIsLoginView(!isLoginView)} className="toggle-auth-button">
        {isLoginView ? 'Need an account? Sign Up' : 'Have an account? Login'}
      </button>
    </div>
  );
};