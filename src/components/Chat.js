import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Chat.css';

const Chat = ({ ticketId, sender }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const token = localStorage.getItem('token');
  const userId = JSON.parse(localStorage.getItem('user'))?.id;

  useEffect(() => {
    if (!ticketId || !token) return;

    axios.get(`http://localhost:5000/chat/${ticketId}`, {
      headers: { 'x-access-token': token }
    }).then(res => {
      setMessages(res.data);
    }).catch(console.error);
  }, [ticketId, token]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post('http://localhost:5000/messages', {
        ticket_id: ticketId,
        sender: sender,      // <-- Use sender prop here
        message: newMessage,
        user_id: userId
      });

      if (response.status === 201) {
        setMessages([...messages, { sender: sender, message: newMessage }]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-header">Ticket #{ticketId} Chat</h2>
      <div className="chat-box">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet.</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.sender === sender ? 'sent' : 'received'}`}
            >
              <span className="chat-sender">{msg.sender}:</span>{' '}
              <span className="chat-text">{msg.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="chat-input-container">
        <input
          className="chat-input"
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="chat-send-btn" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
