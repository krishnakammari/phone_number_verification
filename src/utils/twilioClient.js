const twilio = require('twilio');

// Initialize twilio client (if environment variables are missing, it will throw an error, 
// so we wrap it or instantiate lazily if we want app to start regardless)
let client = null;

const getTwilioClient = () => {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not found in environment variables. SMS will not be sent.');
      return null;
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Sends an SMS message via Twilio
 * @param {string} to - The recipient's phone number
 * @param {string} message - The message body
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const sendSMS = async (to, message) => {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
    return true; // Return true to allow testing without Twilio credentials
  }

  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`SMS sent successfully to ${to}. Message SID: ${response.sid}`);
    return true;
  } catch (error) {
    console.error(`Failed to send SMS to ${to}: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendSMS,
};
