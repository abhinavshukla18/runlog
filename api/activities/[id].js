const axios = require('axios');

module.exports = async (req, res) => {
  const cookies = req.headers.cookie || '';
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('access_token='));
  if (!tokenCookie) return res.status(401).json({ error: 'Not authenticated' });
  const accessToken = tokenCookie.split('=').slice(1).join('=').trim();
  
  // Get single activity by ID
  const url = req.url || '';
  const idMatch = url.match(/\/(\d+)/);
  
  if (idMatch) {
    const id = idMatch[1];
    try {
      const response = await axios.get(`https://www.strava.com/api/v3/activities/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.json(response.data);
    } catch (err) {
      return res.status(500).json({ error: err.response?.data || err.message });
    }
  }
  
  // Get all activities
  const { page = 1, per_page = 30 } = req.query;
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, per_page }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};