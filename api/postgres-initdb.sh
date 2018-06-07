#!/bin/sh -e

psql --variable=ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  DROP DATABASE "emotes";
  CREATE DATABASE "emotes";
EOSQL

psql -1 emotes < /data/emotes.bak -U "$POSTGRES_USER"