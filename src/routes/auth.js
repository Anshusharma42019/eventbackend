const express = require('express');
const { login, getMe, createUser, getUsers, registerAdmin } = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/users', auth, authorize('Admin'), createUser);
router.get('/users', auth, authorize('Admin'), getUsers);

module.exports = router;