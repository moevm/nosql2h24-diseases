from flask import Flask

app = Flask(__name__, static_folder='static')
app.secret_key = ' key'
app.config['JSON_AS_ASCII'] = False

from app import routes
