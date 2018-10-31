const AWS = require('aws-sdk');
const dynamoose = require('dynamoose');

require('../config/aws');

// article schema
let mediaSchema = new dynamoose.Schema({
  medianame:{
    type: String,
    required: false
  },
  mediaartist:{
    type: String,
    required: false
  },
  medialocation:{
    type: String,
    required: false
  },
  media_id:{
    type: String,
    hashKey: true,
    required: true
  },
  searchterms:{
    type: String,
    required: true
  }
});

let Media =  module.exports = dynamoose.model('RLB_MEDIA', mediaSchema);
