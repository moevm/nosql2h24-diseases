from app import app
from app.neo4jConnection import Neo4jConnection

conn = Neo4jConnection(uri="bolt://localhost:7687", user="neo4j", password="3214diseases")

@app.route('/')
@app.route('/index')
def index():
    return "Start page!"

@app.route('/create')
def create():
    try:
        conn.query('CREATE (n:test {name:"HELLO"})-[r:SUIT]->(m:test {name:"WORLD!"})')
        
    except Exception as e:
        return str(e)

    return "created!"

@app.route('/read')
def read():
    try:
        query_string = '''
        MATCH (t:test)
        RETURN t.name
        '''
        Data = [dict(data) for data in conn.query(query_string)]
        return(str(Data))
        
    except Exception as e:
        return str(e)