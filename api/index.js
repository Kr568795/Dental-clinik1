'use strict';

// Vercel serverless entry point.
// Importing server.js does NOT start a listener (it only listens when run
// directly); it just builds and exports the Express app, which Vercel invokes
// as the request handler for every route (see vercel.json).
module.exports = require('../backend/server.js');
