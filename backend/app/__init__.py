from flask import Flask
import os 
import requests
from app.models.neo4jConnection import Neo4jConnection

app = Flask(__name__, static_folder='static')

app.secret_key = ' key'
app.config['JSON_AS_ASCII'] = False

uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
user = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "password")

conn = Neo4jConnection(uri, user, password)

conn.wait_for_neo4j()

from app import routes

initialized = False

@app.before_request
def initialize_app():
    global initialized
    if not initialized:
        initialized = True
        query_string = "MATCH (n) RETURN COUNT(n) AS count"
        if conn.query(query_string):
            file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'default_dump.csv'))
            with open(file_path, 'rb') as f:
                requests.post("http://127.0.0.1:5000/api/import_dump", files={'file': f})

            