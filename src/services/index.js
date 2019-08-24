const storage = require('azure-storage');
const path = require('path');

// Set the env variables
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

// Initializing blobService
const blobService = storage.createBlobService(AZURE_STORAGE_CONNECTION_STRING);

// Method for uploading the data into blob
module.exports.uploadLocalFile = (containerName, filePath) => {
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