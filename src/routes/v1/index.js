const express = require('express');
var crypto = require('crypto');
const fs = require('fs')
var resumable = require('../../services/resumable-node')('/tmp/');

// Set the env variables
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'files';

const services = require('../../services');

const router = express.Router();

router.get('/fileid', function(req, res){
    if(!req.query.filename){
      return res.status(500).end('query parameter missing');
    }
    res.end(
      crypto.createHash('md5')
      .update(req.query.filename)
      .digest('hex')
    );
  });
  
  router.post('/upload', function(req, res){
    // Saving the chunks into tmp dir
      resumable.post(req, function(status, filename, original_filename, identifier){
        if (status === 'done') {
          var writeStream = fs.createWriteStream('./uploads/' + filename);
          // Creating the original file from the chunks
          resumable.write(identifier, writeStream, {
            onDone: function(){
              services.uploadLocalFile(CONTAINER_NAME, './uploads/' + filename).then(resp => {
                res.status(200).json({success: true, message: resp, error: ''});
              })
              .catch(err => {
                  res.status(400).json({success: false, message: '',error: err});
              });
            }
          });
        } else {
          res.send(status);
        }
      });
  });
  
  router.get('/upload', function(req, res){
      resumable.get(req, function(status, filename, original_filename, identifier){
          res.send((status == 'found' ? 200 : 404), status);
      });
  });

  module.exports = router;