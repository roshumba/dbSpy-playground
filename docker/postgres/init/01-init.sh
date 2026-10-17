#!/bin/bash
# Creates dbSpy's local databases and loads the sample dataset.
# Postgres runs this only on first start, when the data volume is empty.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  CREATE DATABASE dbspy_app;
  CREATE DATABASE dbspy_sample;
  CREATE DATABASE dbspy_test;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname dbspy_sample \
  -f /sample/test_postgresDB.sql
