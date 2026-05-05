const axios = require('axios');

module.exports = async (req, res) => {
  const cookies = req.headers.cookie || '';
  const token = cookies.split(';').find(c => c.trim().startsWith('access_token='));
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const accessToken = token.split('=')[1].trim();
  try {
    const athleteRes = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const statsRes = await axios.get(`https://www.strava.com/api/v3/athletes/${athleteRes.data.id}/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.json(statsRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};