FROM neo4j:5.25.1

WORKDIR /var/lib/neo4j/import

COPY dumps/dump.csv /var/lib/neo4j/import/dump.csv

ENV NEO4J_AUTH=neo4j/password

EXPOSE 7474 7687