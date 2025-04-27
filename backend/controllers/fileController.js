const File = require('../models/File');
const OneToOneMessage = require('../models/OneToOneMessage');
const catchAsync = require('../utils/catchAsync');
const path = require('path');

exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  console.log('Received file:', {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  });

  // Create file record in database
  const file = await File.create({
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    uploadedBy: req.user._id
  });

  // Only save to conversation if update_conversation flag is true
  // For our chat app, we'll handle this via socket events instead
  if (req.body.conversation_id && req.body.update_conversation === 'true') {
    const messageType = req.file.mimetype.startsWith('image/') || req.file.mimetype.startsWith('video/') 
      ? 'Media' 
      : 'Document';

    const conversation = await OneToOneMessage.findById(req.body.conversation_id);
    if (conversation) {
      const fileUrl = `/uploads/${req.file.filename}`;
      conversation.messages.push({
        to: req.body.to,
        from: req.user._id,
        type: messageType,
        text: req.body.text || '',
        file: {
          url: fileUrl,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
      await conversation.save();
    }
  }

  // Return file data with URL
  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.status(201).json({
    status: 'success',
    data: {
      file: {
        url: fileUrl,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    }
  });
});

exports.getFile = catchAsync(async (req, res, next) => {
  const file = await File.findById(req.params.id);
  
  if (!file) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found'
    });
  }

  // Check if user has permission to access this file
  const message = await OneToOneMessage.findOne({
    'messages.file': file._id,
    participants: req.user._id
  });

  if (!message) {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to access this file'
    });
  }

  res.sendFile(file.path);
}); 