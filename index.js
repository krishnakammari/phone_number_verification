require('dotenv').config();
const serverless = require('serverless-http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to MongoDB here for the lambda environment
let conn = null;

module.exports.handler = async (event, context) => {
  // Make sure to add this so you can re-use `conn` between function calls.
  context.callbackWaitsForEmptyEventLoop = false;

  // We connect to the DB if we haven't already
  if (!conn) {
    conn = await connectDB();
  }

  // Wrap the express app
  const handler = serverless(app);
  return await handler(event, context);
};
