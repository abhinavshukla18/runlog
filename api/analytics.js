const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  const filePath = path.join(__dirname, '../public/analytics.html');
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};