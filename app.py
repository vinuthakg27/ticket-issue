import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import jwt
import datetime
from functools import wraps
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import SocketIO, join_room, emit

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Socket.IO init
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

SECRET_KEY = 'your_secret_key'

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Vinutha@123",
        database="support_system"
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid!'}), 403
        return f(current_user_id, *args, **kwargs)
    return decorated

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Signup
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        if not name or not email or not password:
            return jsonify({'message': 'Missing required fields'}), 400

        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (name, email, password_hash)
        )
        conn.commit()
        return jsonify({'message': 'Signup successful'}), 201
    except mysql.connector.Error as err:
        print("Database error:", err)
        return jsonify({'message': 'Signup failed'}), 500
    finally:
        cursor.close()
        conn.close()

# Login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=5)
    }, SECRET_KEY, algorithm="HS256")

    user.pop('password_hash', None)
    return jsonify({'token': token, 'user': user})

# Create ticket (with file)
@app.route('/tickets', methods=['POST'])
@token_required
def create_ticket(current_user_id):
    title = request.form.get('title')
    description = request.form.get('description')
    file = request.files.get('attachment')

    filename = None
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tickets (user_id, title, description, status, attachment) VALUES (%s, %s, %s, 'Not Resolved', %s)",
                   (current_user_id, title, description, filename))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Ticket created"})

# Get user tickets
@app.route('/tickets', methods=['GET'])
@token_required
def get_user_tickets(current_user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tickets WHERE user_id = %s", (current_user_id,))
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(result)

# Get all tickets (admin)
@app.route('/admin/tickets', methods=['GET'])
def get_all_tickets():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM tickets")
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(result)

# Update ticket status (admin)
@app.route('/admin/ticket/status', methods=['PUT'])
def update_status():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tickets SET status=%s WHERE id=%s", (data['status'], data['ticket_id']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Status updated"})

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Get chat messages
@app.route('/messages/<int:ticket_id>', methods=['GET'])
def get_messages(ticket_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT sender, message, attachment_path FROM messages WHERE ticket_id = %s ORDER BY id ASC", (ticket_id,))
    messages = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(messages)

# Post chat message
@app.route('/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    ticket_id = data.get('ticket_id')
    sender = data.get('sender')
    message = data.get('message')
    user_id = data.get('user_id')

    if not ticket_id or not sender or not message or not user_id:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO messages (ticket_id, sender, message, user_id) VALUES (%s, %s, %s, %s)",
            (ticket_id, sender, message, user_id)
        )
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Message sent successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Socket.IO events
@socketio.on('joinRoom')
def on_join_room(data):
    ticket_id = str(data['ticketId'])
    join_room(ticket_id)
    print(f"User joined room {ticket_id}")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT sender, message FROM messages WHERE ticket_id = %s ORDER BY id ASC", (ticket_id,))
    messages = cursor.fetchall()
    cursor.close()
    conn.close()
    emit('chatHistory', messages)

@socketio.on('chatMessage')
def on_chat_message(data):
    ticket_id = str(data['ticketId'])
    sender = data['sender']
    message = data['message']

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (ticket_id, sender, message) VALUES (%s, %s, %s)",
            (ticket_id, sender, message)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print("DB insert error:", e)

    emit('chatMessage', {'sender': sender, 'message': message}, room=ticket_id)

# 🔥 Start server
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
