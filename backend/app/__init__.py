from flask import Flask

app = Flask(__name__)
app.secret_key = ' key'

from app import routes
from app import neo4jConnection