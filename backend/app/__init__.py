from flask import Flask
from flask_cors import CORS
import os
from app.models.neo4jConnection import Neo4jConnection
import time
import csv
import logging

app = Flask(__name__, static_folder='static')

cors = CORS(app, resources={r"/api/*": {"origins": ["http://localhost:4200", "http://localhost:8080"]}})

app.secret_key = ' key'
app.config['JSON_AS_ASCII'] = False

uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
user = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "password")

conn = Neo4jConnection(uri, user, password)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

conn.wait_for_neo4j()

from app import routes

initialized = False

def initialize_app():
    query_string = "MATCH (n) RETURN COUNT(n) AS count"
    if conn.query(query_string):
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'default_dump.csv'))
        with open(file_path, 'r') as csvfile:
            reader = csv.reader(csvfile)
            row_count = sum(1 for row in reader) - 1

        query_strings: list(str) = [
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
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
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Symptom'
            MERGE (s:Symptom {{symptom_name: row.symptom_name, symptom_description: row.symptom_description}});
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Disease'
            MERGE (d:Disease {{disease_name: row.disease_name, disease_description: row.disease_description, disease_recommendations: row.disease_recommendations, disease_type: row.disease_type, disease_course: row.disease_course}});
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Analysis'
            MERGE (an:Analysis {{analysis_name: row.analysis_name, analysis_source: row.analysis_source}});
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Appeal'
            MERGE (ap:Appeal {{appeal_date: row.appeal_date, appeal_complaints: row.appeal_complaints}});
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Patient-Appeal'
            MATCH (p:Patient {{mail: row.relation_from}}), (a:Appeal {{appeal_date: row.relation_to}})
            MERGE (p)-[:create]->(a)
            MERGE (a)-[:belong]->(p);
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Appeal-Symptom'
            MATCH (a:Appeal {{appeal_date: row.relation_from}}), (s:Symptom {{symptom_name: row.relation_to}})
            MERGE (a)-[:contain]->(s);
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Symptom-Analysis'
            MATCH (s:Symptom {{symptom_name: row.relation_from}}), (an:Analysis {{analysis_name: row.relation_to}})
            MERGE (s)-[:confirm]->(an);
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Appeal-Disease'
            MATCH (a:Appeal {{appeal_date: row.relation_from}}), (d:Disease {{disease_name: row.relation_to}})
            MERGE (a)-[:predict]->(d);
            ''',
            f'''
            LOAD CSV WITH HEADERS FROM 'file:///{os.path.basename(file_path)}' AS row
            WITH row WHERE row.type = 'Symptom-Disease'
            MATCH (d:Disease {{disease_name: row.relation_from}}), (s:Symptom {{symptom_name: row.relation_to}})
            MERGE (s)-[:describe {{symptom_weight: toFloat(row.symptom_weight)}}]->(d)
            MERGE (d)-[:cause {{symptom_weight: toFloat(row.symptom_weight)}}]->(s);
            '''
        ]

        for query_string in query_strings:
            result = conn.query(query_string)

            if result is None:
                logger.error(query_string)
        logger.info("Database initialization completed successfully.")    

initialize_app()

            