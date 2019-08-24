// Importing all dependencies
const express = require('express');
const app = express();
const multipart = require('connect-multiparty');

const routes = require('./routes/v1');

// Using multipart
app.use(multipart());

// Allowing CORS
app.use(function (req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   next();
});

// Log Incoming requests
app.all('*', (req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  return next();
});

// Passing the routes
app.use(routes);

// Handling invalid routes
app.all('*', (req, res) => {
  res.status(404).json({statusCode: 404, message: 'Invalid Route', data: '', error: ''})
});

app.listen(3000, () => {
  console.log(`The server is running on PORT ${3000}`);
});
