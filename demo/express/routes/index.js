var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Nodefony Client' });
});

/* GET home page. */
router.get('/cdn', function(req, res, next) {
  res.render('cdn', { title: 'Nodefony Client CDN' });
});

module.exports = router;
