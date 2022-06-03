#! /bin/bash
mongoimport -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --db $MONGO_INITDB_DATABASE --collection users --type json --file ./init_db.json --authenticationDatabase admin 