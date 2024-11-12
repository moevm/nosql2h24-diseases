from app import app
from app.models.neo4jConnection import Neo4jConnection
from app.models.allowedEntity import allowed_entity_parameters
import re
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, Response, jsonify, json
import requests
import os

uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
user = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "password")

conn = Neo4jConnection(uri, user, password)
 

@app.route('/')
@app.route('/index')
def index():
    return redirect(url_for('db_page', entity_type="Disease"))

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

    msg : str = None
    if request.method == 'POST' and 'full_name' in request.form and \
                                    'password' in request.form and \
                                    'email' in request.form and \
                                    'sex' in request.form and \
                                    'birthday' in request.form and \
                                    'height' in request.form and \
                                    'weight' in request.form and \
                                    "admin" in request.form:

        full_name : str = request.form['full_name']
        password : str = request.form['password']
        email : str = request.form['email']
        sex : str = request.form['sex']
        birthday : str = request.form['birthday']
        height : float = request.form['height']
        weight : float = request.form['weight']
        admin : bool = request.form['admin']

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
            MERGE (p:Patient {full_name: $full_name, password: $password, email: $email, sex: $sex, birthday: $birthday, height: $height, weight: $weight, registration_date: $rd, admin: $admin})
            '''

            conn.query(query_string, {"full_name": full_name, "password": password, "email": email,
                                    "sex": sex, "birthday": birthday, "rd": datetime.now().isoformat(), "height": height, "weight": weight, "admin": admin})

            msg = "Success"

    elif request.method == 'POST':
        msg = "Пожалуйста, заполните форму!"

    return msg
        
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
    msg = None
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
            session["admin"] = patient_data["admin"]
        else:
            msg = 'Неправильный логин или пароль'
    elif request.method == 'GET':
        return render_template('account.html', session = session, certain_page = False)

    if msg is None:
        return redirect(url_for('db_page', entity_type="Disease"))
    else:
        return render_template('account.html', session = session, certain_page = False, err = msg)

@app.route('/logout', methods=['GET'])
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
    session.pop('admin', None)
    
    return redirect(url_for('login'))

@app.route('/entities', methods=['POST'])
def readEntities() -> json:
    '''
    Функция отвечает за чтение любой сущности из базы данных.

    Ключевые переменные: 
        entity_type (str) : наименование сущности, которую надо считать из БД

    Возвращаемые данные: 
        jsonify(entities_parametrs_list) (json) : массив со словарями, которые хранят
        параметры всех нодов с меткой "entity_type". 
    '''

    entity_type : str = request.form['entity_type']

    query_string : str = f'''
    MATCH(p:{entity_type})
    RETURN p
    '''
   
    entities_list : list[Record] = conn.query(query_string)

    entities_parametrs_list : list[dict] = []

    if entities_list:
        for entity in entities_list:
            entities_parametrs_list.append(entity.data()["p"])

    return jsonify(entities_parametrs_list)


@app.route('/create_entity', methods=['POST']) 
def createEntities():
    '''
    Функция отвечает за добавление элемента сущности в базу данных. Разрешено добавление только 
    определённых сущностей со строго заданными параметрами.  

    Ключевые переменные: 
        entity_type (str) : наименование сущности, которую надо добавить в БД
        entity_parametrs (dict) : параметры, которые надо добавить в нод сущности 
        entity_parametrs_for_query (str) : форматирует запись json в необходимую форму
        записи для выполнения команды на Cypher (запрос для neo4j)
        

    Возвращаемые данные: 
        jsonify(entities_parametrs_list) (json) : массив со словарями, которые хранят
        параметры всех нодов с меткой "entity_type". 
    '''

    print(request)

    data : json = request.json
    entity_type : str = data.get('entity_type')
    entity_parametrs : dict = data.get('parametrs', {})

    if entity_type and entity_parametrs:

        if entity_type not in allowed_entity_parameters:
            return jsonify({"Error": "Invalid type of entity"}), 400

        for parametr in entity_parametrs:
            if parametr not in allowed_entity_parameters[entity_type]:
                return jsonify({"Error": f'Parametr {parametr} not allowed to this entity\'s type'}), 400
        
        entity_parametrs_for_query : str = ', '.join([f'{key}: "{value}"' if isinstance(value, str) else f'{key}: {value}' for key, value in entity_parametrs.items()])
        query_string : str = f'''MERGE(p:{entity_type} {{{entity_parametrs_for_query}}})'''

        result : list[Record] = conn.query(query_string)

        return "Success"
    
    else:
        return jsonify({"Error": "Invalid format of form"}), 400
    
@app.route('/db/<entity_type>', methods=['GET'])
def db_page(entity_type):
    '''
    Функция отвечает за получение данных, создание таблицы сущностей определённого типа и её визуализацию.

    Ключевые переменные: 
        entity_type (str) : наименование сущности, которую надо добавить в БД
        data (dict) : база данных с требуемыми запрошенными по entity_type сущностями 
        

    Возвращаемые данные: 
        render_template('data_bases.html', session = session, certain_page = False, entity_type = entity_type, lst = data) (string) : возвращаем шаблон страницы с таблицей и данными о пользователе 
    '''
    response = requests.post("http://127.0.0.1:5000/entities", data={'entity_type': entity_type})
    data = response.json()

    match(entity_type):
        case 'Disease':
            data.insert(0, {"name": "Наименование", \
                            "description": "Описание", \
                            "recommendations": "Рекомендации", \
                            "type": "Возбудитель", \
                            "course": "Протекание болезни"} )
        case 'Patient':
            data.insert(0, {"full_name": "Фамилия и Имя", \
                            "email": "Почта", \
                            "password": "Пароль", \
                            "sex": "Пол", \
                            "birthday": "День рождения", \
                            "last_update": "Время последнего действия", \
                            "registration_date": "Дата регистрации", \
                            "height": "Рост", \
                            "weight": "Вес", \
                            "admin": "Права администратора"})
        case 'Appeal':
            data.insert(0, {"date": "Дата", "complaints": "Жалобы"})
        case 'Symptom':
            data.insert(0, {"name": "Наименование", "description": "Описание"})            

    return render_template('data_bases.html', session = session, certain_page = False, entity_type = entity_type, lst = data)


