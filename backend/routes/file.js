const express = require('express');
const fileController = require('../controllers/fileController');
const authController = require('../controllers/authController');
const upload = require('../utils/fileUpload');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Upload file
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Get file
router.get('/:id', fileController.getFile);

module.exports = router; 