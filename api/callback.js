const axios = require('axios');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  const { code } = req.query;
  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, athlete } = response.data;

    res.setHeader('Set-Cookie', [
      `access_token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `refresh_token=${refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `athlete=${encodeURIComponent(JSON.stringify(athlete))}; Path=/; Secure; SameSite=Lax`
    ]);

    const filePath = path.join(__dirname, '../public/dashboard.html');
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.redirect('/?error=auth_failed');
  }
};