const express = require('express');
const { getPassTypes, createPassType, updatePassType, deletePassType, getDashboardStats } = require('../controllers/passController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', getPassTypes);
router.post('/', auth, authorize('Admin'), createPassType);
router.put('/:id', auth, authorize('Admin'), updatePassType);
router.delete('/:id', auth, authorize('Admin'), deletePassType);
router.get('/dashboard/stats', auth, authorize('Admin'), getDashboardStats);

module.exports = router;