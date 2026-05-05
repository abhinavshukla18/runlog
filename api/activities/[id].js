const axios = require('axios');

module.exports = async (req, res) => {
  const cookies = req.headers.cookie || '';
  const token = cookies.split(';').find(c => c.trim().startsWith('access_token='));
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const accessToken = token.split('=')[1].trim();
  const { id } = req.query;
  try {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};