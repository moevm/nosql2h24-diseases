from flask import Flask
from flask_cors import CORS 

app = Flask(__name__, static_folder='static')

cors = CORS(app, resources={r"/api/*": {"origins": ["http://localhost:4200"]}})

app.secret_key = ' key'
app.config['JSON_AS_ASCII'] = False

from app import routes
