const axios = require('axios');
const path = require('path');
const fs = require('fs');

function getToken(req) {
  const cookies = req.headers.cookie || '';
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('access_token='));
  if (!tokenCookie) return null;
  return tokenCookie.split('=').slice(1).join('=').trim();
}

function serveHTML(res, filename) {
  const filePath = path.join(__dirname, '../public', filename);
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
}

module.exports = async (req, res) => {
  const url = req.url.split('?')[0];
  const token = getToken(req);

  // AUTH
  if (url === '/api/auth') {
    const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
    const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;
    res.writeHead(302, { Location: `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read,activity:read_all` });
    res.end();
    return;
  }

  // CALLBACK
  if (url === '/api/callback') {
    const code = new URLSearchParams(req.url.split('?')[1]).get('code');
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      const { access_token, refresh_token, athlete } = response.data;
      res.setHeader('Set-Cookie', [
        `access_token=${access_token}; Path=/; Max-Age=21600; SameSite=Lax`,
        `refresh_token=${refresh_token}; Path=/; Max-Age=2592000; SameSite=Lax`,
        `athlete=${encodeURIComponent(JSON.stringify(athlete))}; Path=/; Max-Age=21600; SameSite=Lax`
      ]);
      serveHTML(res, 'dashboard.html');
    } catch (err) {
      res.writeHead(302, { Location: '/?error=auth_failed' });
      res.end();
    }
    return;
  }

  // LOGOUT
  if (url === '/api/logout') {
    res.setHeader('Set-Cookie', [
      'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'athlete=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // ATHLETE
  if (url === '/api/athlete') {
    if (!token) { res.writeHead(401); res.end(JSON.stringify({ error: 'Not authenticated' })); return; }
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${token}` }
      });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(response.data));
    } catch (err) {
      res.writeHead(500); res.end(JSON.stringify({ error: 'Failed' }));
    }
    return;
  }

  // ACTIVITIES
  if (url.startsWith('/api/activities')) {
    if (!token) { res.writeHead(401); res.end(JSON.stringify({ error: 'Not authenticated' })); return; }
    const params = new URLSearchParams(req.url.split('?')[1]);
    const id = params.get('id');
    try {
      if (id) {
        const response = await axios.get(`https://www.strava.com/api/v3/activities/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.data));
      } else {
        const page = params.get('page') || 1;
        const per_page = params.get('per_page') || 30;
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, per_page }
        });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.data));
      }
    } catch (err) {
      res.writeHead(500); res.end(JSON.stringify({ error: err.response?.data || err.message }));
    }
    return;
  }

  // STATS
  if (url === '/api/stats') {
    if (!token) { res.writeHead(401); res.end(JSON.stringify({ error: 'Not authenticated' })); return; }
    try {
      const athleteRes = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsRes = await axios.get(`https://www.strava.com/api/v3/athletes/${athleteRes.data.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(statsRes.data));
    } catch (err) {
      res.writeHead(500); res.end(JSON.stringify({ error: 'Failed' }));
    }
    return;
  }

  // HTML PAGES
  if (url === '/dashboard') { serveHTML(res, 'dashboard.html'); return; }
  if (url === '/activity') { serveHTML(res, 'activity.html'); return; }
  if (url === '/analytics') { serveHTML(res, 'analytics.html'); return; }
  if (url === '/goals') { serveHTML(res, 'goals.html'); return; }
  if (url === '/planner') { serveHTML(res, 'planner.html'); return; }
  if (url === '/shoes') { serveHTML(res, 'shoes.html'); return; }
  if (url === '/journal') { serveHTML(res, 'journal.html'); return; }
  if (url === '/activities') { serveHTML(res, 'activities.html'); return; }
  if (url === '/routes') { serveHTML(res, 'routes.html'); return; }

  // HOME
  serveHTML(res, 'index.html');
};