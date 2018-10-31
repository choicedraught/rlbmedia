
const AWS = require('aws-sdk');
const express = require('express');
const path = require('path');
const dynamoose = require('dynamoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const config = require('./config/database');
const passport = require('passport')

const port = 3003;
const publicfolder = 'public';

// init app - express web server
const app = express();

// Bring in models
let Media = require('./models/media');

// load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// set public folder
app.use(express.static(path.join(__dirname, publicfolder)));

// Express Session middleware
app.use(session({
  secret: 'secret futhermucking secret',
  resave: true,
  saveUninitialized: true,
  searchstrings: {}
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use((req, res, next) => {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator middleware
app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
    var namespace = param.split('.')
    , root = namespace.shift()
    , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Passport config
require('./config/passport-cognito')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// home route
app.get('/', ensureAuthenticated, (req, res) => {
  res.render('search', {
  });
});

// all route
app.get('/all', ensureAuthenticated, (req, res) => {
  Media.scan().exec((err, media) => {
    if (err) {
      console.log(err);
    } else {
      res.render('results', {
        title:'All Media',
        mediaitems: media
      });
    }
  });
});

app.get('/login', (req, res) => {
  // if (req.params.failurecode) { console.log(req.params.failurecode)}
  //console.log('Query Strings Provided..')
  // [req.query].forEach((param) => {
  //   console.log(param);
  // });
  if (req.query.newpassword) {
    res.render('login', {
      title: 'Login',
      failuremsg: 'New Password Required',
      newpassword: 'newpassword'
    });
  } else {
    res.render('login', {
      title: 'Login'
    });
  }
});

// Server
// app.post('/auth/cognito',
//   passport.authenticate('cognito', {
//     successRedirect: '/',
//     failureRedirect: '/login'
//   })
// );

function dump(obj) {
    var out = '';
    for (var i in obj) {
        out += i + ": " + obj[i] + "\n";
    }

    return out;
}

app.post('/auth/cognito', function(req, res, next) {
  // console.log('Request parameters: ' + dump(req.body))
  // req.checkBody('title', 'Title is required').notEmpty();

  // we should check the username field is all lower case, otherwise it throws a wobbly

  passport.authenticate('cognito', function(err, user, info) {
    if (err) {
      console.log('Error: ' + err);
      console.log('Error Information: ' + info);
      return next(err);
     }
    if (!user) {
      console.log('Information: ')
      console.log(dump(info))
      if (info.code == 'NotAuthorizedException') {
        // Incorrect username and or password
        return res.redirect('/login?badpassword=true&failuremessage='+info.message);
      }
      if (info.code == 'InvalidParameterException') {
        // Missing attributes from user
        // what are those missing attributes?
        return res.redirect('/login?missingattrs=true&failuremessage='+info.message);
      } if (info.message == 'New Password Required' ) {
        // New Password Required - send the newpassword attr
        return res.redirect('/login?newpassword=true&failuremsg='+info.message);
      }
    }
    req.login(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

// app.post('/auth/cognito', (req, res) => {
//   passport.authenticate('cognito', (info) => {
//     var querystring = []
//     [info].forEach((i) => {
//       querystring.push(i);
//     });
//
//   })(req, res);
// }),
// successRedirect: '/',
// failureRedirect: '/login?'+querystring.join('&')
// });

// app.post('/auth/cognito', (req, res, next) => {
//   passport.authenticate('cognito', (error, user, info) => {
//     console.log(error);
//     console.log(user);
//     console.log(info);
//
//     // if (error) {
//     //   res.status(401).send(error);
//     // } else if (user) {
//     //   res.status(401).send(info);
//     // } else {
//     //   next();
//     // }
//
//     if (!user) {
//       if (info.InvalidParameterException) {
//         //this is the missing name attribute exception
//       } else if ( info.message == 'New Password Required' ) {
//         //res.status(401).send(info);
//         res.redirect('/login?newpassword=true&failuremsg='+info.message)
//       } else if ( info.NotAuthorizedException ) {
//         // this was the incorrect password one
//         console.log('Login error: ' + info.NotAuthorizedException)
//       } else {
//         next();
//       }
//     }
//
//     // res.status(401).send(info);
//   })(req, res);
//   },
//
// // function to call once successfully authenticated
// function (req, res) {
//   res.status(200).send('logged in!');
// });

app.get('/logout', ensureAuthenticated, function(req, res){
    console.log("logging out");
    console.log(res.user);
    req.logout();
    res.redirect('/');
});

// Access control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}

// Route files
let mediaroute = require('./routes/mediaroute.js');
let searchroute = require('./routes/searchroute.js');
let usersroute = require('./routes/users');
app.use('/media', mediaroute);
app.use('/search', searchroute);
// app.use('/users', usersroute);

// start server
app.listen(port, () => {
  console.log('Server started on port ' + port);
});
