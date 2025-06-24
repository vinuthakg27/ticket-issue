import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Ticket, Reply
from werkzeug.utils import secure_filename

ticket_bp = Blueprint('tickets', __name__)

@ticket_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    user_data = get_jwt_identity()
    data = request.form
    file = request.files.get('image')
    filename = None

    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))

    ticket = Ticket(
        subject=data['subject'],
        description=data['description'],
        image=filename,
        user_id=user_data['id']
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"message": "Ticket created"})

@ticket_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    user_data = get_jwt_identity()
    if user_data['is_admin']:
        tickets = Ticket.query.all()
    else:
        tickets = Ticket.query.filter_by(user_id=user_data['id']).all()

    return jsonify([{
        "id": t.id,
        "subject": t.subject,
        "description": t.description,
        "status": t.status,
        "image": t.image,
        "created_at": t.created_at,
        "user": t.user.username
    } for t in tickets])

@ticket_bp.route('/<int:ticket_id>/reply', methods=['POST'])
@jwt_required()
def add_reply(ticket_id):
    user_data = get_jwt_identity()
    data = request.json
    reply = Reply(
        message=data['message'],
        is_admin=user_data['is_admin'],
        ticket_id=ticket_id
    )
    db.session.add(reply)
    db.session.commit()
    return jsonify({"message": "Reply added"})

@ticket_bp.route('/<int:ticket_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(ticket_id):
    user_data = get_jwt_identity()
    if not user_data['is_admin']:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json
    ticket = Ticket.query.get(ticket_id)
    ticket.status = data['status']
    db.session.commit()
    return jsonify({"message": "Status updated"})

@ticket_bp.route('/<int:ticket_id>/replies', methods=['GET'])
@jwt_required()
def get_replies(ticket_id):
    replies = Reply.query.filter_by(ticket_id=ticket_id).all()
    return jsonify([{
        "id": r.id,
        "message": r.message,
        "is_admin": r.is_admin,
        "created_at": r.created_at
    } for r in replies])
