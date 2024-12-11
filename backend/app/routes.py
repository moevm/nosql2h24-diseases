from app import app
from app.models.neo4jConnection import Neo4jConnection
from app.models.utils.allowedEntity import allowed_entity_parameters, CSV_columns, allowed_relations
from app.models.utils.modelsForDumpTransform import create_relation_dict
import re
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, Response, jsonify, json
import requests
import os
import csv 

uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
user = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "password")

conn = Neo4jConnection(uri, user, password)

@app.route('/api/')
@app.route('/index')
def index():
    return redirect(url_for('db_page', entity_type="Disease"))

@app.route('/api/register', methods=['GET', 'POST'])
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
        
@app.route('/api/login', methods=['GET', 'POST'])
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
        return jsonify({"msg": None, "entity_type": "Disease"})
    else:
        return jsonify({"session": session, "certain_page": False, "err": msg})

@app.route('/api/logout', methods=['GET'])
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

@app.route('/api/entities', methods=['POST'])
def readEntities() -> json:
    '''
    Функция отвечает за чтение любой сущности из базы данных. Фильтрация имеет следующий вид:

        {"filter_params": {"filter1-field": "height", "filter1-action": "IN", "filter1-value": "[0,5]",
        "filter2-field": "fullname", "filter2-action": "CONTAINS", "filter2-value": "ушков",
        "filter3-field": "sex", "filter3-action": "IS", "filter3-value": "male", ...}}

    Ключевые переменные: 
        entity_type (str) : наименование сущности, которую надо считать из БД

    Возвращаемые данные: 
        jsonify(entities_parametrs_list) (json) : массив со словарями, которые хранят
        параметры всех нодов с меткой "entity_type". 
    '''

    entity_type : str = request.form['entity_type']
    filter_params : dict = json.loads(request.form['filter_params'])

    query_string : str = ""
    tmp_filter_string : str = ""

    query_string : str = f'MATCH(p:{entity_type})\n'
    
    if filter_params:

        query_string += f'WHERE p.{filter_params["filter1-field"]} {filter_params["filter1-action"]} {filter_params["filter1-value"]}'

        filter_idx = 2

        while(filter_params.get(f'filter{filter_idx}-field')):
            query_string += "AND\n"
            query_string += f'WHERE p.{filter_params[f'filter{filter_idx}-field']} {filter_params[f'filter{filter_idx}-action']} {filter_params[f'filter{filter_idx}-value']}'

    query_string += '\nRETURN p'    

   
    entities_list : list[Record] = conn.query(query_string)

    entities_parametrs_list : list[dict] = []

    if entities_list:
        for entity in entities_list:
            entities_parametrs_list.append(entity.data()["p"])

    return jsonify(entities_parametrs_list)


@app.route('/api/create_entity', methods=['POST']) 
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
    
@app.route('/api/db/<entity_type>', methods=['GET'])
def db_page(entity_type):
    '''
    Функция отвечает за получение данных, создание таблицы сущностей определённого типа и её визуализацию.

    Ключевые переменные: 
        entity_type (str) : наименование сущности, которую надо добавить в БД
        data (dict) : база данных с требуемыми запрошенными по entity_type сущностями 
        

    Возвращаемые данные: 
        render_template('data_bases.html', session = session, certain_page = False, entity_type = entity_type, lst = data) (string) : возвращаем шаблон страницы с таблицей и данными о пользователе 
    '''
    response = requests.post("http://127.0.0.1:5000/api/entities", data={'entity_type': entity_type})
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

    return jsonify({"session": session, "certain_page": False, "entity_type": entity_type, "lst": data})


@app.route('/api/import_dump', methods=['POST'])
def import_dump():
    query_strings : list(str) = [
        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Patient'
        MERGE (p:Patient {fullname: row.fullname, mail: row.mail, password: row.password, sex: row.sex, age: row.age, height: row.height, weight: row.weight, last_update: row.last_update, admin: row.admin, birthday: row.birthday, registration_data: row.registration_data});
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Symptom'
        MERGE (s:Symptom {symptom_name: row.symptom_name, symptom_description: row.symptom_description});
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Disease'
        MERGE (d:Disease {disease_name: row.disease_name, disease_description: row.disease_description, disease_recommendations: row.disease_recommendations, disease_type: row.disease_type, disease_course: row.disease_course});
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Analysis'
        MERGE (an:Analysis {analysis_name: row.analysis_name, analysis_source: row.analysis_source});
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Appeal'
        MERGE (ap:Appeal {appeal_date: row.appeal_date, appeal_complaints: row.appeal_complaints});
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Patient-Appeal'
        MATCH (p:Patient {mail: row.relation_from}), (a:Appeal {appeal_date: row.relation_to})
        MERGE (p)-[:create]->(a)
        MERGE (a)-[:belong]->(p);
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Appeal-Symptom'
        MATCH (a:Appeal {appeal_date: row.relation_from}), (s:Symptom {symptom_name: row.relation_to})
        MERGE (a)-[:contain]->(s);
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Symptom-Analysis'
        MATCH (s:Symptom {symptom_name: row.relation_from}), (an:Analysis {analysis_name: row.relation_to})
        MERGE (s)-[:confirm]->(an);
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Appeal-Disease'
        MATCH (a:Appeal {appeal_date: row.relation_from}), (d:Disease {disease_name: row.relation_to})
        MERGE (a)-[:predict]->(d);
        ''',

        '''
        LOAD CSV WITH HEADERS FROM 'file:///dump.csv' AS row
        WITH row WHERE row.type = 'Symptom-Disease'
        MATCH (d:Disease {disease_name: row.relation_from}), (s:Symptom {symptom_name: row.relation_to})
        MERGE (s)-[:describe {symptom_weight: row.symptom_weight}]->(d)
        MERGE (d)-[:cause {symptom_weight: row.symptom_weight}]->(s);
        '''
    ]
    
    for query_string in query_strings:     
        result = conn.query(query_string)
        if result is None:
            return jsonify({"Error": f"error loading the database dump: {query_string}"}), 400
        
    return "Success"

@app.route('/api/export_dump', methods=['POST'])
def export_dump():
    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models/dumps/dump.csv'))
    
    with open(file_path, "w") as csvfile:
        writer = csv.DictWriter(csvfile, delimiter = ',', quotechar = '"', quoting = csv.QUOTE_ALL, fieldnames=CSV_columns)
        writer.writeheader()

        for entity_type in allowed_entity_parameters.keys():
            response = requests.post("http://127.0.0.1:5000/api/entities", data={'entity_type': entity_type})
            data = response.json()

            for row in data:
                row["type"] = entity_type
                writer.writerow(row)

        for relation_type in allowed_relations:
            relation_from, relation_to = relation_type.split('-')
 
            query_string : str = f'''
            MATCH((a:{relation_from})-[r]->(b:{relation_to}))
            RETURN a,r,b 
            '''
        
            relations_list : list[Record] = conn.query(query_string)

            if relations_list:
                for relation in relations_list:
                    row_dict = create_relation_dict(relation.data()["a"], relation.data()["b"], relation['r'].get('symptom_weight', None), relation_type)
                    writer.writerow(row_dict)

    return "Success"