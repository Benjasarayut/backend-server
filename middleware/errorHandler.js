module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success:false, error:'Validation failed' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ success:false, error:'Duplicate field value' });
  }
  res.status(500).json({ success:false, error:'Internal server error' });
};
