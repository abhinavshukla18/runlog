const axios = require('axios');

module.exports = async (req, res) => {
  const cookies = req.headers.cookie || '';
  console.log('Cookies received:', cookies);
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('access_token='));
  if (!tokenCookie) {
    console.log('No token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const accessToken = tokenCookie.split('=').slice(1).join('=').trim();
  const { id } = req.query;
  console.log('Fetching activity:', id, 'with token:', accessToken.substring(0, 10) + '...');
  try {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Strava error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};