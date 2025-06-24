import sqlite3
from flask import request, jsonify
import jwt
from functools import wraps

SECRET_KEY = "your-secret-key"  # Make sure it's the same as in app.py

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            kwargs['user_id'] = data['sub']
            kwargs['is_admin'] = data['is_admin']
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated
