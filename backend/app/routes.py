from flask import Flask
from flask_cors import CORS
from app import app, conn
from app.models.neo4jConnection import Neo4jConnection
from app.models.utils.allowedEntity import allowed_entity_parameters, CSV_columns, allowed_relations
from app.models.utils.modelsForDumpTransform import create_relation_dict
import re
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, Response, jsonify, json, send_file
import requests
import os
import csv

# Initialize CORS
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:8080"}})

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
    data : dict = request.json
    fullname : str = data.get('fullname')
    password : str = data.get('password')
    confirmed_password : str = data.get('confirmed_password')
    mail : str = data.get('mail')
    sex : str = data.get('sex') if data.get('sex') else ''
    birthday : str = data.get('birthday') if data.get('birthday') else ''
    height : float = data.get('height') if data.get('height') else ''
    weight : float = data.get('weight') if data.get('weight') else ''
    admin : bool = data.get('admin')

    if request.method == 'POST' and fullname and password and confirmed_password and mail:


        query_string : str = '''
        MATCH(p:Patient {mail: $mail})
        RETURN p
        '''

        msg = None
        patient : list[Record] = conn.query(query_string, {"mail": mail})

        if patient: 
            msg = "Данная почта уже занята!"
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', mail): 
            msg = "Почта введена некорректно"
        elif not re.match(r'[А-Яа-я]+', fullname): 
            msg = "Имя может содержать только буквы!"
        elif password.isdigit(): 
            msg = "Пароль должен содержать буквы!"
        elif password != confirmed_password:
            msg = "Пароли не совпадают!" 
        elif not fullname or not password:
            msg = "Пожалуйста, заполните форму!"

        else:
            query_string = '''
            MERGE (p:Patient {fullname: $fullname, password: $password, mail: $mail, sex: $sex, birthday: $birthday, height: $height, weight: $weight, registration_date: $rd, last_update: $lu, admin: $admin})
            '''

            print(fullname, password, mail, sex, birthday, height, weight, admin)

            current_datetime = datetime.now()
            # Форматируем дату и время в формате "yyyy-mm-dd hh:mm:ss"
            formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

            conn.query(query_string, {"fullname": fullname, "password": password, "mail": mail,
                                    "sex": sex, "birthday": birthday, "rd": formatted_datetime, "lu": formatted_datetime, "height": height, "weight": weight, "admin": admin})

    elif request.method == 'POST':
        msg = "Пожалуйста, заполните форму!"

    return jsonify({"msg": msg})
        
@app.route('/api/login', methods=['POST'])
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
    user_dict = {}

    data : dict = request.json
    mail : str = data.get('mail')
    password : str = data.get('password')

    if request.method == 'POST' and mail and password:

        query_string : str = '''
        MATCH(p:Patient {mail: $mail, password: $password})
        RETURN p
        '''

        patient : list[Record] = conn.query(query_string, {"mail": mail, "password": password})

        if patient: 
            patient_data : dict = patient[0].data()["p"]
            user_dict["fullname"] = patient_data["fullname"]
            user_dict["password"] = patient_data["password"]
            user_dict["mail"] = patient_data["mail"]
            user_dict["sex"] = patient_data["sex"]
            user_dict["birthday"] = patient_data["birthday"]
            user_dict["height"] = patient_data["height"]
            user_dict["weight"] = patient_data["weight"]
            user_dict["admin"] = patient_data["admin"]

        else:
            msg = 'Неправильный логин или пароль'

    else:
        msg = 'Заполните данные логина и пароля'

    return jsonify({"msg": msg, "user_data": user_dict})

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
    data : dict = request.json
    entity_type : str = data.get('entity_type')
    filter_params : str = data.get('filter_params', {})
    relation_type : str = data.get('relation_type')
    patient_filter_params: str = data.get('patient_filter_params', {})

    date_list = ['birthday', 'last_update', 'registration_date', 'appeal_date']
    compare_operations = [">", "<", ">=", "<="]

    query_string : str = ""
    tmp_filter_string : str = ""

    if relation_type:
        query_string = f'MATCH((p:{entity_type})-[r:{relation_type}]->(b))'
    else:
        query_string = f'MATCH(p:{entity_type})\n'

    if filter_params:
        filter_idx = 1
        query_string += "WHERE "

        while filter_params.get(f'filter{filter_idx}-field'):
            field = filter_params[f'filter{filter_idx}-field']
            action = filter_params[f'filter{filter_idx}-action']
            value = filter_params[f'filter{filter_idx}-value']

            if field in date_list and action in compare_operations:
                query_string += f'datetime(replace(p.{field}, " ", "T")) {action} datetime({value})'
            else:
                if isinstance(value, str):
                    if value.isnumeric() or (value.count('.') == 1 and value.replace('.', '').isnumeric()):
                        value = float(value) if '.' in value else int(value)
                        query_string += f'p.{field} {action} {value}'
                    else:
                        value = value.lower()
                        query_string += f'lower(p.{field}) {action} "{value}"'
                else:
                    query_string += f'p.{field} {action} {value}'

            filter_idx += 1
            if filter_params.get(f'filter{filter_idx}-field'):
                query_string += " AND\n"
    if patient_filter_params:
        if not filter_params:
            query_string += "WHERE "
        else:
            query_string += " AND\n"

        field = patient_filter_params[f'filter1-field']
        action = patient_filter_params[f'filter1-action']
        value = patient_filter_params[f'filter1-value']

        value = value.lower()
        query_string += f'lower(b.{field}) {action} "{value}"'


    if relation_type:
        query_string += '\nRETURN p,r,b'
    else:
        query_string += '\nRETURN p'

    entities_list : list[Record] = conn.query(query_string)

    entities_parametrs_list : list[dict] = []

    if entities_list:
        for entity in entities_list:
            entity_data = entity.data()["p"]

            if(relation_type):
                if(entity_data in entities_parametrs_list):
                    entities_parametrs_list[entities_parametrs_list.index(entity_data)+1].append(entity.data()["b"])
                else:
                    entities_parametrs_list.append(entity_data)
                    entities_parametrs_list.append([entity.data()["b"]])

            else:
                entities_parametrs_list.append(entity_data)
                #entities_parametrs_list.append([])
    
    return jsonify({"ans": entities_parametrs_list, "req": query_string})


@app.route('/api/appeal_database', methods=['POST'])
def appeal_database():
    data : dict = request.json
    filter_params : str = data.get('filter_params', {})
    patient_filter_params : str = data.get('patient_filter_params', {})

    response = requests.post("http://127.0.0.1:5000/api/entities", json={'entity_type': 'Appeal', 'filter_params': filter_params, 'relation_type': 'belong', 'patient_filter_params': patient_filter_params})
    patients = response.json()["ans"]
    patients_log = response.json()["req"]

    response = requests.post("http://127.0.0.1:5000/api/entities", json={'entity_type': 'Appeal', 'filter_params': filter_params, 'relation_type': 'contain'})
    symptoms = response.json()["ans"]
    symptoms_log = response.json()["req"]

    appeal_database = []

    for i in range(0, len(patients), 2):
        row = {}
        row["appeal"] = patients[i]
        row["patient"] = patients[i+1][0]
        row["related"] = symptoms[symptoms.index(row["appeal"]) + 1]
        appeal_database.append(row)

    return jsonify({"ans": appeal_database, "patients": patients_log, "symptoms": symptoms_log})
    

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
    entity_parametrs : dict = data.get('params', {})

    if entity_type and entity_parametrs:

        if entity_type not in allowed_entity_parameters:
            return jsonify({"Error": "Invalid type of entity"}), 400

        for parametr in entity_parametrs:
            if parametr not in allowed_entity_parameters[entity_type]:
                return jsonify({"Error": f'Parametr {parametr} not allowed to this entity\'s type'}), 400

        entity_parametrs_for_query : str = ', '.join([
            f'{key}: {float(value) if "." in value else int(value)}'
            if value.replace('.', '', 1).isdigit() else
            f'{key}: "{value}"'
            for key, value in entity_parametrs.items()
        ])
        query_string : str = f'''MERGE(p:{entity_type} {{{entity_parametrs_for_query}}});'''

        result : list[Record] = conn.query(query_string)

        return jsonify({"status": "Success"}), 200

    else:
        return jsonify({"status": "Error", "Error": "Invalid format of form"}), 400


@app.route('/api/set_admin', methods=['POST'])
def set_entity():
    data : json = request.json
    entity_mail : str = data.get('mail')
    entity_admin : str = data.get('flag')

    if entity_mail and entity_admin:
        query_string = f'''MATCH(p:Patient{{mail:'{entity_mail}'}})
        SET p.admin = '{entity_admin}'
        '''

        conn.query(query_string)

        return jsonify({"status": "Success", "admin": entity_admin}), 200
    else:
        return jsonify({"error": "No mail or admin fields"}), 400


@app.route('/api/import_dump', methods=['POST'])
def import_dump():

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file:
        file_path = os.path.join('/backend/app/models/dumps', file.filename)
        file.save(file_path)

        with open(file_path, 'r') as csvfile:
            reader = csv.reader(csvfile)
            row_count = sum(1 for row in reader) - 1


    query_string = "MATCH(p) DETACH DELETE p"
    conn.query(query_string)

    query_strings : list(str) = [
        f'''
                LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Patient'
        MERGE (p:Patient {{
            fullname: row.fullname,
            mail: row.mail,
            password: row.password,
            sex: row.sex,
            age: toInteger(row.age),
            height: toFloat(row.height),
            weight: toFloat(row.weight),
            last_update: row.last_update,
            admin: row.admin,
            birthday: row.birthday,
            registration_date: row.registration_date
        }});
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Symptom'
        MERGE (s:Symptom {{symptom_name: row.symptom_name, symptom_description: row.symptom_description}});
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Disease'
        MERGE (d:Disease {{disease_name: row.disease_name, disease_description: row.disease_description, disease_recommendations: row.disease_recommendations, disease_type: row.disease_type, disease_course: row.disease_course}});
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Analysis'
        MERGE (an:Analysis {{analysis_name: row.analysis_name, analysis_source: row.analysis_source}});
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Appeal'
        MERGE (ap:Appeal {{appeal_date: row.appeal_date, appeal_complaints: row.appeal_complaints}});
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Patient-Appeal'
        MATCH (p:Patient {{mail: row.relation_from}}), (a:Appeal {{appeal_date: row.relation_to}})
        MERGE (p)-[:create]->(a)
        MERGE (a)-[:belong]->(p);
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Appeal-Symptom'
        MATCH (a:Appeal {{appeal_date: row.relation_from}}), (s:Symptom {{symptom_name: row.relation_to}})
        MERGE (a)-[:contain]->(s);
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Symptom-Analysis'
        MATCH (s:Symptom {{symptom_name: row.relation_from}}), (an:Analysis {{analysis_name: row.relation_to}})
        MERGE (s)-[:confirm]->(an);
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Appeal-Disease'
        MATCH (a:Appeal {{appeal_date: row.relation_from}}), (d:Disease {{disease_name: row.relation_to}})
        MERGE (a)-[:predict]->(d);
        ''',

        f'''
        LOAD CSV WITH HEADERS FROM 'file:///{file.filename}' AS row
        WITH row WHERE row.type = 'Symptom-Disease'
        MATCH (d:Disease {{disease_name: row.relation_from}}), (s:Symptom {{symptom_name: row.relation_to}})
        MERGE (s)-[:describe {{symptom_weight: toFloat(row.symptom_weight)}}]->(d)
        MERGE (d)-[:cause {{symptom_weight: toFloat(row.symptom_weight)}}]->(s);
        '''
    ]
    
    for query_string in query_strings:     
        result = conn.query(query_string)
        if result is None:
            return jsonify({"Error": f"error loading the database dump: {query_string}"}), 400
        
    return jsonify({"Success": f"File uploaded successfully", "total_enters": row_count}), 200

@app.route('/api/export_dump', methods=['POST'])
def export_dump():
    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models/dumps/dump.csv'))
    
    with open(file_path, "w") as csvfile:
        writer = csv.DictWriter(csvfile, delimiter = ',', quotechar = '"', quoting = csv.QUOTE_ALL, fieldnames=CSV_columns)
        writer.writeheader()

        for entity_type in allowed_entity_parameters.keys():
            response = requests.post("http://127.0.0.1:5000/api/entities", json={'entity_type': entity_type})
            data = response.json()["ans"]

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

    return send_file(file_path, as_attachment=True, mimetype='text/csv')

@app.route('/api/merge_entities', methods=['POST'])
def merge_entities():
    data = request.json
    entity_A_type = data['entity_A_type']
    entity_B_type = data['entity_B_type']
    entity_A_params = data['entity_A_params']
    entity_B_params = data['entity_B_params']
    relation_type = data['relation_type']

    entity_A_param_str = f"{entity_A_params['param']}: '{entity_A_params['value']}'"
    entity_B_param_str = f"{entity_B_params['param']}: '{entity_B_params['value']}'"

    check_query_A = f'''
    MATCH (A:{entity_A_type} {{{entity_A_param_str}}})
    RETURN A
    '''
    check_query_B = f'''
    MATCH (B:{entity_B_type} {{{entity_B_param_str}}})
    RETURN B
    '''

    result_A = conn.query(check_query_A)
    result_B = conn.query(check_query_B)

    if not result_A or not result_B:
        return jsonify({'status': 'Error', 'Error': f'Entity A or Entity B not found', 'query': check_query_A + "\n" + check_query_B}), 400

    query_string = f'''
    MATCH (A:{entity_A_type} {{{entity_A_param_str}}}), (B:{entity_B_type} {{{entity_B_param_str}}})
    MERGE (A)-[r:{relation_type}]->(B)
    '''

    try:
        result = conn.query(query_string)
        return jsonify({'status': 'Success'}), 200
    except Exception as e:
        return jsonify({'status': 'Error', 'Error': f'Error while merging entities: {str(e)}', 'query': query_string}), 400



@app.route('/api/create_appeal', methods=['POST'])
def create_appeal():
    data = request.json
    appeal_date = data.get('appeal_date')
    appeal_complaints = data.get('appeal_complaints')
    patient = data.get('patient')
    symptoms = data.get('symptoms')

    if appeal_date and appeal_complaints and patient and symptoms:
        response = requests.post("http://127.0.0.1:5000/api/create_entity", json={'entity_type': 'Appeal', 'params': {'appeal_date': appeal_date, 'appeal_complaints': appeal_complaints}})
        status = response.json().get("status")

        if status == "Success":
            for symptom in symptoms:
                response = requests.post("http://127.0.0.1:5000/api/merge_entities", json={
                    'entity_A_type': 'Appeal',
                    'entity_B_type': 'Symptom',
                    'entity_A_params': {'param': 'appeal_date', 'value': appeal_date},
                    'entity_B_params': {'param': 'symptom_name', 'value': symptom},
                    'relation_type': 'contain'
                })

                status = response.json().get('status')
                if status == 'Error':
                    return jsonify({'status': 'Error', 'Error': f"Error while merging symptom: {symptom} - {response.json().get('Error')}", 'query': response.json().get('query')})

            response1 = requests.post("http://127.0.0.1:5000/api/merge_entities", json={
                'entity_A_type': 'Appeal',
                'entity_B_type': 'Patient',
                'entity_A_params': {'param': 'appeal_date', 'value': appeal_date},
                'entity_B_params': {'param': 'mail', 'value': patient},
                'relation_type': 'belong'
            })

            response2 = requests.post("http://127.0.0.1:5000/api/merge_entities", json={
                'entity_A_type': 'Patient',
                'entity_B_type': 'Appeal',
                'entity_B_params': {'param': 'appeal_date', 'value': appeal_date},
                'entity_A_params': {'param': 'mail', 'value': patient},
                'relation_type': 'create'
            })

            if response1.json().get('status') == 'Error' or response2.json().get('status') == 'Error':
                return jsonify({'status': 'Error', 'Error': f'Error while merging patient: {patient}'})

            return jsonify({'status': 'Success'})
        else:
            return jsonify({'status': 'Error', 'Error': f"Error while creating appeal: {response.json().get('Error')}"})
    else:
        return jsonify({'status': 'Error', 'Error': 'Error while merging patient: empty data'})


@app.route('/api/predict_disease', methods=['POST'])
def predict_disease():
    data = request.json
    appeal_date = data.get('appeal_date')

    response = requests.post("http://127.0.0.1:5000/api/appeal_database", json={"filter_params": 
                                                                        {                                                                                                      
                                                                            "filter1-field": "appeal_date",
                                                                            "filter1-action": "CONTAINS",
                                                                            "filter1-value": appeal_date
                                                                        }})

    appeal_symptoms = response.json()["ans"][0]["related"]
    

    possible_diseases = []

    for appeal_symptom in appeal_symptoms:
        response = requests.post("http://127.0.0.1:5000/api/entities", json={"entity_type": "Symptom", "filter_params": 
                                                                        {                                                                                                      
                                                                            "filter1-field": "symptom_name",
                                                                            "filter1-action": "CONTAINS",
                                                                            "filter1-value": appeal_symptom["symptom_name"]
                                                                        }, "relation_type": "describe"})

        answer = response.json()["ans"]

        for i in range(1, len(answer), 2):
            for disease in answer[i]:
                if disease not in possible_diseases:
                    possible_diseases.append(disease)
        
    appeal_symptoms_names = []
    
    for symptom in appeal_symptoms:
        appeal_symptoms_names.append(symptom["symptom_name"])
    
    predicted_results = []
    
    for disease in possible_diseases:

        query_string = f'''
        MATCH (d:Disease {{disease_name: '{disease["disease_name"]}'}})-[r:cause]->(s:Symptom)
        RETURN SUM(r.symptom_weight)
        '''

        total_weight = conn.query(query_string)

        query_string = f'''
        MATCH (d:Disease {{disease_name: '{disease["disease_name"]}'}})-[r:cause]->(s:Symptom)
        WHERE s.symptom_name in {appeal_symptoms_names}
        RETURN SUM(r.symptom_weight)
        '''

        appeal_weight = conn.query(query_string)

        if total_weight and appeal_weight:
            result = {"disease": disease}
            result["percent"] = round(appeal_weight[0][0] / total_weight[0][0] * 100, 2)
            predicted_results.append(result)

    return jsonify({"ans": predicted_results})







            
                                                       
    
    

