const router = require('express').Router();
const c = require('../controllers/statsController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/dashboard', c.dashboard);

module.exports = router;
