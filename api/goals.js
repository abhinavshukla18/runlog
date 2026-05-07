// Goals page
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  const filePath = path.join(__dirname, '../public/goals.html');
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};