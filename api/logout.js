module.exports = (req, res) => {
  res.setHeader('Set-Cookie', [
    'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'athlete=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]);
  res.redirect('/');
};