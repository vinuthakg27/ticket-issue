from flask import Blueprint, request, jsonify
from datetime import datetime
from utils import get_db_connection, token_required  # ✅



chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat/send', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.json
    ticket_id = data.get('ticket_id')
    message = data.get('message')

    if not ticket_id or not message:
        return jsonify({'error': 'Missing ticket_id or message'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (ticket_id, sender_id, message) VALUES (%s, %s, %s)",
        (ticket_id, current_user['id'], message)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Message sent successfully'}), 200

@chat_bp.route('/chat/<int:ticket_id>', methods=['GET'])
@token_required
def get_messages(current_user, ticket_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT sender_id, message, timestamp FROM messages WHERE ticket_id = %s ORDER BY timestamp ASC",
        (ticket_id,)
    )
    messages = cursor.fetchall()
    conn.close()
    return jsonify(messages)
