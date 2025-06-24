import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Chat from './components/Chat';
import './Admin.css';

function Admin() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('All');
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  const fetchTickets = useCallback(() => {
    axios.get('http://localhost:5000/admin/tickets')
      .then(res => setTickets(res.data));
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateStatus = (id, status) => {
    axios.put('http://localhost:5000/admin/ticket/status', {
      ticket_id: id,
      status
    }).then(fetchTickets);
  };

  const filteredTickets = tickets.filter(ticket =>
    filter === 'All' || ticket.status === filter
  );

  return (
    <div className="admin-container">
      
        <h2>Admin Dashboard</h2>
        
          <label>Status Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All" >All</option>
            <option value="Resolved" class="status-resolved ">Resolved</option>
            <option value="Not Resolved" class="status-notresolved ">Not Resolved</option>
            <option value="In Progress" class="status-inprogress">In Progress</option>
          </select>
       <table className="ticket-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Attachment</th>
              <th>Chat</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket, index) => (
              <React.Fragment key={ticket.id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{ticket.title}</td>
                  <td>{ticket.description}</td>
                  <td>
                    <select
                      value={ticket.status}
                      onChange={e => updateStatus(ticket.id, e.target.value)}
                    >
                      <option value="Resolved" class="status-resolved ">Resolved</option>
            <option value="Not Resolved" class="status-notresolved ">Not Resolved</option>
            <option value="In Progress" class="status-inprogress">In Progress</option>
                    </select>
                  </td>
                  <td>
                    {ticket.attachment && (
                      <img
                        src={`http://localhost:5000/uploads/${ticket.attachment}`}
                        alt="attachment"
                        className="ticket-img"
                      />
                    )}
                  </td>
                  <td>
                    <button
                      className="chat-button"
                      onClick={() => setExpandedTicketId(
                        expandedTicketId === ticket.id ? null : ticket.id
                      )}
                    >
                      {expandedTicketId === ticket.id ? 'Hide' : 'Chat'}
                    </button>
                  </td>
                </tr>
                {expandedTicketId === ticket.id && (
                  <tr className="chat-row">
                    <td colSpan="6">
                      <div className="chat-box">
                        <Chat ticketId={ticket.id} sender="admin" />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan="6" className="no-ticket">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
   
  );
}

export default Admin;
