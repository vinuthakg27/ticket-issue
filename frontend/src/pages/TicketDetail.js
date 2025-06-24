import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function TicketDetail() {
  const { id } = useParams();
  const [replies, setReplies] = useState([]);
  const [message, setMessage] = useState('');
  const [ticket, setTicket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');


  const loadTicket = async () => {
    const res = await axios.get('https://ticket-issue.onrender.com/api/tickets', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const current = res.data.find(t => t.id === parseInt(id));
    setTicket(current);
    setNewStatus(current.status);
  };

  const loadReplies = async () => {
    const res = await axios.get(`http://localhost:5000/api/tickets/${id}/replies`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setReplies(res.data);
  };

  useEffect(() => {
  const token = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
  setIsAdmin(token.is_admin);

  const fetchData = async () => {
    const ticketRes = await axios.get('http://localhost:5000/api/tickets/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const current = ticketRes.data.find(t => t.id === parseInt(id));
    setTicket(current);
    setNewStatus(current.status);

    const replyRes = await axios.get(`http://localhost:5000/api/tickets/${id}/replies`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setReplies(replyRes.data);
  };

  fetchData();
  loadChat();
  const interval = setInterval(loadChat, 3000);
  return () => clearInterval(interval);
}, [id]);

const loadChat = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/chat/${id}`, {
      headers: { 'x-access-token': localStorage.getItem('token') }
    });
    setChatMessages(res.data);
  } catch (err) {
    console.error("Error loading chat:", err);
  }
};

const sendChat = async () => {
  try {
    await axios.post(`http://localhost:5000/chat/send`, {
      ticket_id: id,
      message: chatInput
    }, {
      headers: { 'x-access-token': localStorage.getItem('token') }
    });
    setChatInput('');
    loadChat();
  } catch (err) {
    console.error("Error sending chat:", err);
  }
};



  const sendReply = async () => {
    await axios.post(`http://localhost:5000/api/tickets/${id}/reply`, {
      message
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setMessage('');
    loadReplies();
  };

  const updateStatus = async () => {
    await axios.patch(`http://localhost:5000/api/tickets/${id}/status`, {
      status: newStatus
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    alert("Status updated");
    loadTicket();
  };

  if (!ticket) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">{ticket.subject}</h2>
      <p>Description: {ticket.description}</p>
      <p>Status: {ticket.status}</p>
      {ticket.image && (
        <img src={`http://localhost:5000/static/uploads/${ticket.image}`} alt="attachment" className="mt-2 w-64" />
      )}

      {isAdmin && (
        <div className="mt-4">
          <label>Status:</label>
          <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button className="btn mt-2" onClick={updateStatus}>Update Status</button>
        </div>
      )}

      <h3 className="mt-6 mb-2 font-bold">Replies</h3>
      <ul className="space-y-2">
        {replies.map((r, i) => (
          <li key={i} className="p-2 border rounded">
            <strong>{r.is_admin ? "Support" : "User"}:</strong> {r.message}
          </li>
        ))}
      </ul>

      <h3 className="mt-6 mb-2 font-bold">Live Chat</h3>
<div className="border p-4 rounded max-h-64 overflow-y-auto mb-4 bg-gray-50">
  {chatMessages.map((msg, index) => (
    <div key={index} className={`mb-2 ${msg.sender_id === token.sub ? 'text-right' : 'text-left'}`}>
      <div className="inline-block bg-blue-100 p-2 rounded">
        <p>{msg.message}</p>
        <small className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</small>
      </div>
    </div>
  ))}
</div>
<div className="flex gap-2">
  <input
    type="text"
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    placeholder="Type a chat message"
    className="input flex-1"
  />
  <button className="btn" onClick={sendChat}>Send</button>
</div>


      <textarea className="input mt-4" placeholder="Reply..." value={message} onChange={e => setMessage(e.target.value)} />
      <button className="btn mt-2" onClick={sendReply}>Send</button>
    </div>
  );
}

export default TicketDetail;
