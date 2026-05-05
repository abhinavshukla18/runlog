const axios = require('axios');

module.exports = async (req, res) => {
  const cookies = req.headers.cookie || '';
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('access_token='));
  if (!tokenCookie) return res.status(401).json({ error: 'Not authenticated' });
  const accessToken = tokenCookie.split('=').slice(1).join('=').trim();
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch athlete' });
  }
};