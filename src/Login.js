import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    axios.post('http://localhost:5000/login', { email, password })
      .then(res => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate('/dashboard');
      })
      .catch(() => alert("Invalid credentials"));
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Login</h2>
      <input
        className="auth-input"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="auth-input"
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
      />
      <button className="auth-button" onClick={handleLogin}>Login</button>
      <p className="auth-footer">
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
      <p className="auth-footer">
        Are you an admin? <a href="/admin">Go to Admin Panel</a>
      </p>
    </div>
  );
}

export default Login;
