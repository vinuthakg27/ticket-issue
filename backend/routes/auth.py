from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = generate_password_hash(data.get('password'))
    is_admin = data.get('is_admin', False)
    user = User(username=username, password=password, is_admin=is_admin)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if user and check_password_hash(user.password, data.get('password')):
        access_token = create_access_token(identity={"id": user.id, "is_admin": user.is_admin})
        return jsonify(access_token=access_token)
    return jsonify({"message": "Invalid credentials"}), 401
