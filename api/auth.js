const axios = require('axios');

module.exports = (req, res) => {
  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;
  const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read,activity:read_all`;
  res.redirect(url);
};