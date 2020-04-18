let jwt = require('jsonwebtoken');
let config = require('./config');
var express = require('express');
var router = express.Router();
const Mongolib = require("./db/Mongolib.js");
var md5 = require('md5');
var roles = require("user-groups-roles");
global.Buffer = global.Buffer || require('buffer').Buffer;
let token = "";

roles.createNewRole("admin");
roles.createNewRole("editor");
roles.createNewRole("subscriber");

roles.createNewPrivileges(["/", "GET"], "get users", false);
roles.createNewPrivileges(["/signin", "POST"],"add user", true);//forall
roles.createNewPrivileges(["/delete", "POST"], "delete user", false);
roles.createNewPrivileges(["/update", "PUT"], "update user", false);
roles.createNewPrivileges(["/login", "POST"], "get users", true);//forall

//admin
roles.addPrivilegeToRole("admin",["/", "GET"], true);
roles.addPrivilegeToRole("admin",["/delete", "POST"], true);
roles.addPrivilegeToRole("admin",["/update", "PUT"], true);

//editor (todos menos get)
roles.addPrivilegeToRole("editor",["/delete", "POST"], true);
roles.addPrivilegeToRole("editor",["/put", "PUT"], true);

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
                user = docs[0];

                let mockedUsername = user.username;
                let mockedRol = user.rol;
                let mockedPassword = user.password;

                // Si se especifico un usuario y contraseña, proceda con la validación
                // de lo contrario, un mensaje de error es retornado
                if (username && password) {

                    // Si los usuarios y las contraseñas coinciden, proceda con la generación del token
                    // de lo contrario, un mensaje de error es retornado
                    if (username === mockedUsername && password === mockedPassword ) {

                        // Se genera un nuevo token para el nombre de usuario el cuál expira en 24 horas
                        token = jwt.sign({ username: username , rol : mockedRol},
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

                if (user.length !== 0) {

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

    delete(req, res) {

        let username = req.body.username;
        let user = token.split(".");
        if(user.length===0){
            res.json({
                success: false,
                message: "No se pudo mostrar los usuarios, no hay una sesión activa"
            }); 
        }else{

            let payload=user[1];
            let user1 = Buffer.from(payload, 'base64').toString();
            let userJson = JSON.parse(user1);

            Mongolib.getDatabase(db => {
                Mongolib.findDocumentByUsername(username, db, docs => {
    
                    let rolDB = userJson.rol;
                    
                    let permitted = roles.getRoleRoutePrivilegeValue(rolDB,"/delete","POST");

                    if (docs.length === 0 || !permitted) {
    
                        res.sendStatus(400).send('The username has not been found');
                    } else {
                        Mongolib.getDatabase(db => {
                            Mongolib.deleteDocument(db, req, res1 => {
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
    }

    update(req, res) {

        let username = req.body.username;
        let user = token.split(".");
        if(user.length===0){
            res.json({
                success: false,
                message: "No se pudo mostrar los usuarios, no hay una sesión activa"
            }); 
        }else{

            let payload=user[1];
            let user1 = Buffer.from(payload, 'base64').toString();
            let userJson = JSON.parse(user1);

            Mongolib.getDatabase(db => {
                Mongolib.findDocumentByUsername(username, db, docs => {
                    
                    let rolDB = userJson.rol;
                    
                    let permitted = roles.getRoleRoutePrivilegeValue(rolDB,"/update","PUT");
    
                    if (docs.length === 0 || !permitted) {
    
                        res.sendStatus(400).send('The username has not been found or you do not have the permits to carry out this action.');
    
                    } else {
                        Mongolib.getDatabase(db => {
                            Mongolib.updateDocument(db, req, res1 => {
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
    }

    index(req, res) {
        let user = token.split(".");
        if(user.length===0){
            res.json({
                success: false,
                message: "No se pudo mostrar los usuarios, no hay una sesión activa"
            }); 
        }else{
            let payload=user[1];
            let user1 = Buffer.from(payload, 'base64').toString();
            let userJson = JSON.parse(user1);

            // Retorna una respuesta exitosa con previa validación del token Y LOS USUARIOS
            Mongolib.getDatabase(db => {
                Mongolib.findDocuments(db, docs => {
                    let rolDB = userJson.rol;
                    
                    let permitted = roles.getRoleRoutePrivilegeValue(rolDB,"/","GET");
                    if (!permitted) {
    
                        res.sendStatus(400).send('This user does not have the permits to carry out this action.');
    
                    } else{
                       res.json({
                        success: true,
                        message: docs
                    }); 
                    }
                    
                })
            })
        }
    }
}

module.exports = HandlerGenerator;