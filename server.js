// server.js
const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

// static folders
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(flash());
app.use(session({
  secret: 'cat is dead',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

// make flash messages available in templates
app.use(function(req, res, next){
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// require route modules (they will use shared db pool)
const patientRoute = require('./routes/patient');
const doctorRoute = require('./routes/doctor');

// mount routers (routes already use absolute paths like /login, /register)
app.use('/', patientRoute);
app.use('/', doctorRoute);

// static html routes (if you still serve raw html files)
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views', 'mainpage.html'));
});
app.get('/doctors', function(req, res){
  res.sendFile(path.join(__dirname, 'views', 'doctors.html'));
});
app.get('/patients', function(req, res){
  res.sendFile(path.join(__dirname, 'views', 'patients.html'));
});

app.listen(PORT, function(){
  console.log("application running on port: " + PORT);
});
