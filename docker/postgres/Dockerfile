FROM postgres:15

# Copy SSL certs and an init script that moves them into PGDATA on first init
COPY server.crt /tmp/server.crt
COPY server.key /tmp/server.key
COPY 0-init-ssl.sh /docker-entrypoint-initdb.d/0-init-ssl.sh
RUN chmod 700 /docker-entrypoint-initdb.d/0-init-ssl.sh && \
    chmod 600 /tmp/server.key
