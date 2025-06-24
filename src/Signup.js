import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = () => {
    axios.post('http://localhost:5000/signup', { name, email, password })
      .then(res => {
        alert(res.data.message);
        navigate('/');
      })
      .catch(err => {
        if (err.response && err.response.data && err.response.data.message) {
          alert(`Signup failed: ${err.response.data.message}`);
        } else {
          alert('Signup failed due to server error');
        }
      });
  };

  return (
    <div>
      <h2>Signup</h2>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" /><br />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /><br />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" /><br />
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
