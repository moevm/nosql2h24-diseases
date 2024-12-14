from neo4j import GraphDatabase
import time

class Neo4jConnection:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        if self.driver is not None:
            self.driver.close()

    def query(self, query, parameters=None, db=None):
        assert self.driver is not None, "Driver not initialized!"
        session = None
        response = None
        try:
            session = self.driver.session(database=db) if db is not None else self.driver.session()
            response = list(session.run(query, parameters))
        except Exception as e:
            print("Query failed:", e)
        finally:
            if session is not None:
                session.close()
        return response

    def wait_for_neo4j(self, max_retries=10, delay=5):
        for attempt in range(max_retries):
            try:
                with self.driver.session() as session:
                    session.run("RETURN 1")
                return True
            except Exception as e:
                print(f"Neo4j is not ready yet: {e}")
                time.sleep(delay)
        return False
