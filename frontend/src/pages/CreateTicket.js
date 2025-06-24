import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateTicket() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Please enter subject and description.');
      return;
    }

    console.log('Submit clicked');

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('description', description);
      if (image) formData.append('image', image);

      await axios.post('http://localhost:5000/api/tickets/', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Ticket submitted successfully!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error submitting ticket:', error.response?.data || error.message);
      alert('Failed to submit ticket. Please try again.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Create Ticket</h2>
      <input
        className="input"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className="input mt-2"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="file"
        className="mt-2"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button
        className="btn mt-4"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
}

export default CreateTicket;
