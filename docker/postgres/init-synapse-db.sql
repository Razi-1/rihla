CREATE USER synapse WITH PASSWORD 'CHANGE_ME_match_synapse_homeserver_yaml';
CREATE DATABASE synapse OWNER synapse;
GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse;
