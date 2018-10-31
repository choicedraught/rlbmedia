// const AWS = require('aws-sdk');
// const dynamoose = require('dynamoose');

const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4')

// Bring in Article model
let Media = require('../models/media');

// add route
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('add_media', {
    title:'Add Media'
  });
});

// update submit route
router.post('/edit/:id', (req,res) => {
  //console.log('DEBUG edit POST');
  req.checkBody('name', 'Name is required').notEmpty();
  // req.checkBody('author', 'Author is required').notEmpty();
  req.checkBody('location', 'Location is required').notEmpty();

  var searchTerms = req.body.name.toLowerCase().replace(/[^\w\s]/gi, ' ').split(' '); // remove special characters and turn into array of strings
  searchTerms = removeSingleChars(searchTerms);
  if (req.body.artist) {
    var mediaartist = req.body.artist.toLowerCase().replace(/[^\w\s]/gi, ' ').split(' ')
    mediaartist = removeSingleChars(mediaartist);
    // console.log(mediaartist[0])
    for (var i=0;i<mediaartist.length;i++) {
      //console.log('DEBUG: '+ mediaartist[i])
      if ( searchTerms.includes(mediaartist[i]) ) {
        //console.log("Skipping: " + mediaartist[i] + " - already in array");
      } else {
        searchTerms.push(mediaartist[i]);
      }
    }
  }

  var update = new Media({
    medianame : req.body.name,
    mediaartist : req.body.artist,
    medialocation : req.body.location,
    media_id : req.body.id,
    searchterms : searchTerms.join(' ').replace(/\s\s+/g, ' ') // turn search terms into a string a replace many spaces with single
  });

  update.save((err) => {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("Media: " + req.body.name + " has been updated.");
      req.flash('success', 'Media Updated');
      res.redirect('/media/'+req.body.id);
    }
  });
});

router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Media
  .query('media_id').eq(req.params.id)
  .exec((err, result) => {
    if(err) {
      console.log('Error in edit media: ' + req.params.id);
    } else {
        res.render('edit_media', {
          title:'Edit Media',
          media:result[0]
        });
      }
  });
});

// add submit POST route
router.post('/add', (req,res) => {
  console.log(req.body.name);
  console.log(req.body.location);
  req.checkBody('name', 'Name is required').notEmpty();
  // req.checkBody('author', 'Author is required').notEmpty();
  req.checkBody('location', 'Location is required').notEmpty();

  // Get errors
  let errors = req.validationErrors();

  if(errors){
    res.render('add_media', {
      title:'Add Article',
      errors:errors
    });
  } else {

    var searchTerms = req.body.name.toLowerCase().replace(/[^\w\s]/gi, ' ').split(' '); // remove special characters and turn into array of strings
    searchTerms = removeSingleChars(searchTerms);
    if (req.body.artist) {
      var mediaartist = req.body.artist.toLowerCase().replace(/[^\w\s]/gi, ' ').split(' ')
      mediaartist = removeSingleChars(mediaartist);
      // console.log(mediaartist[0])
      for (var i=0;i<mediaartist.length;i++) {
        //console.log('DEBUG: '+ mediaartist[i])
        if ( searchTerms.includes(mediaartist[i]) ) {
          //console.log("Skipping: " + mediaartist[i] + " - already in array");
        } else {
          searchTerms.push(mediaartist[i]);
        }
      }
    }

    let media = new Media();
    media.medianame = req.body.name;
    media.mediaartist = req.body.artist;
    media.medialocation = req.body.location;
    media.media_id = uuidv4();
    media.searchterms = searchTerms.join(' ').replace(/\s\s+/g, ' ') // turn search terms into a string a replace many spaces with single

    media.save((err) => {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log("Media " + req.body.name + " has been added.");
        req.flash('success','Media Added');
        res.redirect('/media/'+media.media_id);
      }
    });
  }
});

// correct delete route
router.delete('/:id', (req, res) => {
  if(!req.user._id){
    res.status(500).send();
  }

  let query = {_id:req.params.id}

  Media.findById(req.params.id, (err, article) => {
    if(article.author != req.user._id) {
      res.status(500).send();
    } else {
      Media.remove(query, (err) => {
        if (err) {
          console.log(err);
        }
        res.send('Success');
      });
      console.log("Served: " + req.originalUrl);
    }
  });
});

// get single article
router.get('/:id', (req, res) => {
  Media
    .query('media_id').eq(req.params.id)
    .exec(function (err, result) {
      if ( err ) {
        console.log("Error in get media " + err);
      } else {
        res.render('media', {
          title: 'Details:',
          mediaitem: result[0]
        });
      }
      console.log("Served: " + req.originalUrl + " from get all media");
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

function removeSingleChars (mediaartist) {
  var newMediaItem = []
  mediaartist.forEach( (mediaitem) => {
    //console.log ("Item: " + mediaitem)
    if (mediaitem.match(/^[a-z]{1,2}$|^[0-9]{1,2}$/g)) {
      //discard
      //console.log("Discarding: '" + mediaitem + "'")
    } else {
      //console.log("Keeping: " + mediaitem)
      if ( mediaitem != null ) {
        newMediaItem.push(mediaitem);
      }

    }
  });
  return newMediaItem;
}

module.exports = router;
