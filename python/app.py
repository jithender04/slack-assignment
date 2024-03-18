from flask import Flask, request, jsonify, current_app
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId
import jwt
import os
import bcrypt

app = Flask(__name__)

app.config['SECRET_KEY'] = os.environ['JWT_SECRET']

client = MongoClient(os.environ['MONGO_URI'])

db = client.test
tasks = db.tasks
users = db.users

task_schema = {
    'title': str,
    'description': str,
    'status': str,
    'dueDate': str,
    'userId': str
}

user_schema = {
    'username': str,
    'password': str
}

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password

def verify_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def authenticate_user(token):
    try:
        decoded = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return decoded['userId']
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError):
        return None  # Token has expired or Invalid token or missing userId in token

@app.before_request
def protect_endpoints():
    if request.path not in ['/api/login', '/api/register']:
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'message': 'Missing token'}), 401
        user_id = authenticate_user(token.split('Bearer ')[1])
        if not user_id:
            return jsonify({'message': 'Invalid token'}), 401
        request.userId = user_id

@app.route('/api/login', methods=['POST'])
def login():
    auth_data = request.json
    user = users.find_one({'username': auth_data['username']})
    if user and verify_password(auth_data['password'], user['password']):
        token = jwt.encode({'userId': str(user['_id'])}, current_app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token}), 200
    return jsonify({'message': 'Invalid username or password'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    user_data = request.json
    new_user = {key: user_data[key] for key in user_schema.keys()}
    new_user['password'] = hash_password(new_user['password'])
    result = users.insert_one(new_user)
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/tasks', methods=['POST'])
def create_task():
    task_data = request.json
    task_data['userId'] = request.userId
    if 'dueDate' in task_data: 
        task_data['dueDate'] = datetime.strptime(task_data['dueDate'], '%d/%m/%Y') 
    new_task = {}
    for key in task_schema.keys():
        if key in task_data:
            new_task[key] = task_data[key]
    result = tasks.insert_one(new_task)
    return jsonify({'isUpdated': str(result.acknowledged)}), 201

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    query = {'userId' : request.userId}
    if request.args.get('status'):
        query['status'] = request.args.get('status')
    Tasks = tasks.find(query)
    return [{**task, "_id": str(task["_id"])} for task in Tasks], 200

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    task_data = request.json
    if 'dueDate' in task_data: 
        task_data['dueDate'] = datetime.strptime(task_data['dueDate'], '%d/%m/%Y')
    updated_task = {}
    for key in task_schema.keys():
        if key in task_data:
            updated_task[key] = task_data[key]
    result = tasks.update_one({'_id': ObjectId(task_id)}, {'$set': updated_task})
    if result.modified_count > 0:
        return jsonify({'message': 'Task updated successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    result = tasks.delete_one({'_id': ObjectId(task_id)})
    if result.deleted_count > 0:
        return jsonify({'message': 'Task deleted successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
