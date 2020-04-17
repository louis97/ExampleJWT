const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb+srv://usuario1:usuario1@petsociety-jo7y6.mongodb.net/test?authSource=admin&replicaSet=PetSociety-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass%20Community&retryWrites=true&ssl=true';

const dbName = 'seguridad';

const client = new MongoClient(url, { useUnifiedTopology: true });
var md5 = require('md5');

const getDatabase = (callback) => {
    client.connect(function (err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");

        const db = client.db(dbName);

        callback(db, client);
    });
}

const findDocuments = function (db, callback) {
    const collection = db.collection('usuarios');
    collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}
const findDocumentByUsername = function (name, db, callback) {
    const collection = db.collection('usuarios');
    collection.find({ username: name }).toArray(function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

const addDocument = function(db, req,res){
    var user = req.body;
    collection.insertOne(JSON.parse(`{"username": "${user.username}", "password": "${md5(user.password)}"}`), function(err, result) { 
        assert.equal(err, null); 
        res(result); 
    });
}

exports.getDatabase = getDatabase;
exports.findDocuments = findDocuments;
exports.findDocumentByUsername = findDocumentByUsername;
exports.addDocument = addDocument;