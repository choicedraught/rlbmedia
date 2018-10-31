// const AWS = require('aws-sdk');
// const dynamoose = require('dynamoose');

const express = require('express');
const session = require('express-session');
const router = express.Router();

// Bring in Media model
let Media = require('../models/media');


// Bring in the User models
//let User = require('../models/user');

router.get('/', ensureAuthenticated, (req, res, next) => {
  //check for a + sign in the search and use it to and the two srrings

  var searchStrings;
  // console.log(req.params.string);
  // console.log(req.query.keywords);
  if (req.query.lastsearch) {
    //console.log('Search strings: ' + req.session.lastsearch.searchstrings)
    if ( (req.session.hasOwnProperty('lastsearch')) && (req.session.lastsearch.hasOwnProperty('searchstrings')) ) {
      if (req.session.lastsearch.searchstrings != null) {
        // console.log('Search strings NOT null');
        searchStrings = req.session.lastsearch.searchstrings.split(" ");
      } else {
        // something went wrong, sending you back to the home page
        res.redirect('/');
        return next();
      }
    } else {
      // something went wrong, sending you back to the home page
      res.redirect('/');
      return next();
    }
  } else {
    searchStrings = req.query.keywords.toLowerCase().split(" ");
    // store the search strings in the session
    req.session.lastsearch = {
      searchstrings: req.query.keywords.toLowerCase(),
      page: '1' //place holder for the search page
    }
  }

  console.log(searchStrings);
  if (searchStrings.length > 1) {
    var filterExpr ='';
    var exprAttrNames = {}
    var exprAttrVal = {}
    for (var i=0;i<searchStrings.length;i++) {
      exprAttrNames['#st'+i] = 'searchterms';
      exprAttrVal[':st'+i] = searchStrings[i];
      if (i==0) {
        filterExpr += 'contains(#st'+i + ',:st'+i + ')';
        // console.log(filterExpr)
      } else {
        filterExpr += ' or contains(#st'+i + ',:st'+i + ')';
        // console.log(filterExpr)
      }
    }
    var filter = {
      FilterExpression: filterExpr,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrVal
    }
    // console.log(filter)
  } else {
    var filter = {
      FilterExpression: '(contains(#st, :st))',
      ExpressionAttributeNames: {
        '#st': 'searchterms'
      },
      ExpressionAttributeValues: {
        ':st': searchStrings.join()
      }
    }
  }
  // console.log(filter)
  Media
    .scan(filter)
    .exec(function (err, result) {
      if ( err ) {
        console.log("Error in search media " + err);
      } else {
        //console.log(result);
        res.render('results', {
          title: 'Results:',
          mediaitems: result
        });
      }
      console.log("Served: " + req.originalUrl + " from search");
    });
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

module.exports = router;
