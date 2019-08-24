// Importing all dependencies
var express = require('express');
var resumable = require('./resumable-node.js')('/tmp/');
var app = express();
var multipart = require('connect-multiparty');
var crypto = require('crypto');
const storage = require('azure-storage');
const path = require('path');
const fs = require('fs')

// Set the env variables
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'files';
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

// Using multipart
app.use(multipart());

// Initializing blobService
const blobService = storage.createBlobService(AZURE_STORAGE_CONNECTION_STRING);

// Allowing CORS
app.use(function (req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   next();
});

app.get('/fileid', function(req, res){
  if(!req.query.filename){
    return res.status(500).end('query parameter missing');
  }
  res.end(
    crypto.createHash('md5')
    .update(req.query.filename)
    .digest('hex')
  );
});

const uploadLocalFile = (containerName, filePath) => {
  return new Promise((resolve, reject) => {
      const fullPath = path.resolve(filePath);
      const blobName = path.basename(filePath);
      // By default when the file size of big, it automatically splits the file into small chunks :)
      // More info: https://github.com/Azure/azure-storage-node/issues/398 & https://docs.microsoft.com/en-us/javascript/api/azure-storage/azurestorage.services.blob.blobservice.blobservice.createblockblobrequestoptions?view=azure-node-latest#blocksize
      blobService.createBlockBlobFromLocalFile(containerName, blobName, fullPath, err => {
          if (err) {
              reject(err);
          } else {
              resolve({ message: `Local file "${filePath}" is uploaded` });
          }
      });
  });
};


app.post('/upload', function(req, res){
  // Saving the chunks into tmp dir
    resumable.post(req, function(status, filename, original_filename, identifier){
      if (status === 'done') {
        var writeStream = fs.createWriteStream('./uploads/' + filename);
        // Creating the original file from the chunks
        resumable.write(identifier, writeStream, {
          onDone: function(){
            uploadLocalFile(CONTAINER_NAME, './uploads/' + filename).then(resp => {
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

app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        res.send((status == 'found' ? 200 : 404), status);
    });
});

app.get('/download/:identifier', function(req, res){
  var writeStream = fs.createWriteStream('./abc/1.deb');
	resumable.write(req.params.identifier, writeStream);
});
app.get('/resumable.js', function (req, res) {
  var fs = require('fs');
  res.setHeader("content-type", "application/javascript");
  fs.createReadStream("./resumable.js").pipe(res);
});

app.listen(3000, () => {
  console.log(`The server is running on PORT ${3000}`);
});
