from app import app
from app.neo4jConnection import Neo4jConnection
import re
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session

conn = Neo4jConnection(uri="bolt://localhost:7687", user="neo4j", password="password")

@app.route('/')
@app.route('/index')
def index():
    return "Start page!"

@app.route('/register', methods=['POST'])
def register():
    msg = ''
    if request.method == 'POST' and 'full_name' in request.form and \
                                    'password' in request.form and \
                                    'email' in request.form and \
                                    'sex' in request.form and \
                                    'birthday' in request.form and \
                                    'height' in request.form and \
                                    'weight' in request.form:

        full_name = request.form['full_name']
        password = request.form['password']
        email = request.form['email']
        sex = request.form['sex']
        birthday = request.form['birthday']
        height = request.form['height']
        weight = request.form['weight']

        query_string = '''
        MATCH(p:Patient {email: $email})
        RETURN p
        '''

        patient = conn.query(query_string, {"email": email})

        if patient: 
            msg = "Данная почта уже занята!"
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email): 
            msg = "Почта введена некорректно"
        elif not re.match(r'[А-Яа-я]+', full_name): 
            msg = "Имя может содержать только буквы!"
        elif not full_name or not password:
            msg = "Пожалуйста, заполните форму!"

        else:
            query_string = '''
            MERGE (p:Patient {full_name: $full_name, password: $password, email: $email, sex: $sex, birthday: $birthday, height: $height, weight: $weight, registration_date: $rd})
            '''

            conn.query(query_string, {"full_name": full_name, "password": password, "email": email,
                                    "sex": sex, "birthday": birthday, "rd": datetime.now().isoformat(), "height": height, "weight": weight})

            msg = "Success"

    elif request.method == 'POST':
        msg = "Пожалуйста, заполните форму!"

    return msg
        
@app.route('/login', methods=['POST'])
def login():
    msg = ''
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        query_string = '''
        MATCH(p:Patient {email: $email, password: $password})
        RETURN p
        '''

        patient = conn.query(query_string, {"email": request.form['email'], "password": request.form['password']})[0]
        patient_data = patient.data()["p"]

        if patient: 
            session["loggedin"] = True
            session["email"] = patient_data["email"]
            session["full_name"] = patient_data["full_name"]
            
            msg = 'Success'
        else:
            msg = 'Неправильный логин или пароль'

    return msg 

@app.route('/logout', methods=['Post'])
def logout():
    session.pop('loggedin', None)
    session.pop('email', None)
    session.pop('full_name', None)
    
    return 'Success'