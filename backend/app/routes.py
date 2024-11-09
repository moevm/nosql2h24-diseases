from app import app
from app.models.neo4jConnection import Neo4jConnection
import re
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, Response 


conn = Neo4jConnection(uri="bolt://localhost:7687", user="neo4j", password="password")

@app.route('/')
@app.route('/index')
def index():
    return "Start page!"


@app.route('/register', methods=['GET', 'POST'])
def register() -> str:
    '''
    Функция отвечает за регистрацию пользователя. Включает в себя валидацию данных, введённых при регистрации.
    Если все данные верны и аккаунта c данной почтой не существует, создаёт новый узел Patient в БД. 

    Ключевые переменные:
        msg (string) : комментарий об ошибке или успехе, возвращаемый при ответе
        patient (list) : результат поиска пользователя по почте 
        
    Возвращаемые данные:
        render_template('register.html', msg = msg) (string) : возвращаем шаблон страницы с комментарием 
    '''

    msg : str = ''
    if request.method == 'POST' and 'full_name' in request.form and \
                                    'password' in request.form and \
                                    'email' in request.form and \
                                    'sex' in request.form and \
                                    'birthday' in request.form and \
                                    'height' in request.form and \
                                    'weight' in request.form:

        full_name : str = request.form['full_name']
        password : str = request.form['password']
        email : str = request.form['email']
        sex : str = request.form['sex']
        birthday : str = request.form['birthday']
        height : float = request.form['height']
        weight : float = request.form['weight']

        query_string : str = '''
        MATCH(p:Patient {email: $email})
        RETURN p
        '''

        patient : list[Record] = conn.query(query_string, {"email": email})

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

    return render_template('register.html', msg = msg)
        
@app.route('/login', methods=['GET', 'POST'])
def login() -> str:
    '''
    Функция отвечает за вход пользователя в аккаунт. Совершает поиск по почте и паролю.
    Если есть совпадение в БД, то выполняет вход, сохраняя данные пользователя в текущей сессии. 

    Ключевые переменные:
        msg (string) : комментарий об ошибке или успехе, возвращаемый при ответе
        patient (list) : результат поиска пользователя по почте 
        
    Возвращаемые данные:
        render_template('login.html', msg = msg) (string) : возвращаем шаблон страницы с комментарием 
    '''
    msg = ''
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        query_string : str = '''
        MATCH(p:Patient {email: $email, password: $password})
        RETURN p
        '''

        patient : list[Record] = conn.query(query_string, {"email": request.form['email'], "password": request.form['password']})

        if patient: 
            patient_data : dict = patient[0].data()["p"]
            session["loggedin"] = True
            session["email"] = patient_data["email"]
            session["full_name"] = patient_data["full_name"]
            
            msg = 'Success'
        else:
            msg = 'Неправильный логин или пароль'

    return render_template('login.html', msg = msg)

@app.route('/logout', methods=['POST'])
def logout() -> Response:
    '''
    Функция отвечает за выход пользователя из аккаунта. 
    Удаляет данные пользователя из текущей сессии. 
        
    Возвращаемые данные:
        redirect(url_for('login')) (BaseResponse) : переадресация на страницу для входа
    '''
    session.pop('loggedin', None)
    session.pop('email', None)
    session.pop('full_name', None)
    
    return redirect(url_for('login'))