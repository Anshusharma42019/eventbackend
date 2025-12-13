const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, uploadImage);

module.exports = router;