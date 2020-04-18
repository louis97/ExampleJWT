var express = require('express');
var router = express.Router();

var HandlerGenerator = require("../handlegenerator.js");
var middleware = require("../middleware.js");

HandlerGenerator = new HandlerGenerator();

/* GET home page. */
router.get('/', middleware.checkToken, HandlerGenerator.index);

router.post('/signin', middleware.checkToken, HandlerGenerator.signin);

router.post('/delete', middleware.checkToken, HandlerGenerator.delete);

router.put('/update', middleware.checkToken, HandlerGenerator.update);

router.post( '/login', HandlerGenerator.login);

module.exports = router;