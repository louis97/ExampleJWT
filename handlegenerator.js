let jwt = require('jsonwebtoken');
let config = require('./config');
var express = require('express');
var router = express.Router();
const Mongolib = require("./db/Mongolib.js");
var md5 = require('md5');

// Clase encargada de la creación del token
class HandlerGenerator {

    login(req, res) {

        // Extrae el usuario y la contraseña especificados en el cuerpo de la solicitud
        let username = req.body.username;
        let password = md5(req.body.password);

        // Este usuario y contraseña, en un ambiente real, deben ser traidos de la BD
        let user = "";
        Mongolib.getDatabase(db => {
            Mongolib.findDocumentByUsername(username, db, docs => {
                console.log(toString(docs));
                user = docs[0];
                let mockedUsername = user.username;

                let mockedPassword = user.password;

                // Si se especifico un usuario y contraseña, proceda con la validación
                // de lo contrario, un mensaje de error es retornado
                if (username && password) {

                    // Si los usuarios y las contraseñas coinciden, proceda con la generación del token
                    // de lo contrario, un mensaje de error es retornado
                    if (username === mockedUsername && password === mockedPassword) {

                        // Se genera un nuevo token para el nombre de usuario el cuál expira en 24 horas
                        let token = jwt.sign({ username: username },
                            config.secret, { expiresIn: '24h' });

                        // Retorna el token el cuál debe ser usado durante las siguientes solicitudes
                        res.json({
                            success: true,
                            message: 'Authentication successful!',
                            token: token
                        });

                    } else {

                        // El error 403 corresponde a Forbidden (Prohibido) de acuerdo al estándar HTTP
                        res.sendStatus(403).send('Incorrect username or password');
                    }

                } else {

                    // El error 400 corresponde a Bad Request de acuerdo al estándar HTTP
                    res.sendStatus(400).send('Authentication failed! Please check the request');

                }

            })
        })

    }
    signin(req, res) {

        let username = req.body.username;
        let user = "";

        Mongolib.getDatabase(db => {
            Mongolib.findDocumentByUsername(username, db, docs => {
                user = docs;
                console.log("user: ", user);
                if (user.length !== 0) {
                    console.log("user12: ", user);
                    res.status(400).send('The username already exists');
                } else {
                    Mongolib.getDatabase(db => {
                        Mongolib.addDocument(db, req, res1 => {
                            res.json({
                                success: true,
                                response: res1
                            });
                        })
                    })
                }
            })
        })


    }

    index(req, res) {

        // Retorna una respuesta exitosa con previa validación del token
        Mongolib.getDatabase(db => {
            Mongolib.findDocuments(db, docs => {
                res.json({
                    success: true,
                    message: docs
                });
            })
        })


    }
}

module.exports = HandlerGenerator;