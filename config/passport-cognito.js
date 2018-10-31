const passport = require('passport');
const CognitoStrategy = require('passport-cognito')

module.exports = (passport) => {
  passport.use(new CognitoStrategy({
      userPoolId: 'ap-southeast-2_0IIR2Jbnt',
      clientId: 'pmgot9djnes7767gqv7r5b9ea',
      region: 'ap-southeast-2'
    },
    function(accessToken, idToken, refreshToken, user, cb) {
      process.nextTick(function() {
        // ...
        //console.log('Login attempt for: ' + user);
        cb(null, user);
      });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
      done(null, obj);
  });
}
