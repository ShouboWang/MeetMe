var everyauth = require('everyauth');
// Step 1 code goes here

// Step 2 code
var express = require('express');
var app = express();
app.use(express.bodyParser())
  .use(express.cookieParser('mr ripley'))
  .use(express.session())
  .use(everyauth.middleware(app));