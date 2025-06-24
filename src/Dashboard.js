import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTickets = () => {
    axios
      .get('http://localhost:5000/tickets', {
        headers: {
          'x-access-token': token,
        },
      })
      .then((res) => {
        setTickets(res.data);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      await axios.post('http://localhost:5000/tickets', formData, {
        headers: {
          'x-access-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });
      setTitle('');
      setDescription('');
      setAttachment(null);
      fetchTickets();
    } catch (err) {
      alert('Ticket creation failed');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="card">
        <h2>Create Ticket</h2>
        <form onSubmit={handleSubmit} className="ticket-form">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files[0])}
          />
          <button type="submit">Submit Ticket</button>
        </form>
      </div>

      <div className="card">
        <h2>Your Tickets</h2>
        <table className="ticket-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Status</th>
              <th>Attachment</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr key={ticket.id}>
                <td>{index + 1}</td>
                <td>{ticket.title}</td>
                <td>{ticket.status}</td>
                <td>
                  {ticket.attachment ? (
                    <a
                      href={`http://localhost:5000/uploads/${ticket.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
