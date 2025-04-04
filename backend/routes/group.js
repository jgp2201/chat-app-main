const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const groupController = require("../controllers/groupController");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/groups');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Create a new group
router.post("/create", auth, upload.single("avatar"), groupController.createGroup);

// Get all groups for the current user
router.get("/", auth, groupController.getGroups);

// Get a specific group by ID
router.get("/:groupId", auth, groupController.getGroupById);

// Update group details
router.patch("/:groupId", auth, upload.single("avatar"), groupController.updateGroup);

// Delete a group
router.delete("/:groupId", auth, groupController.deleteGroup);

// Add members to a group
router.post("/:groupId/members", auth, groupController.addMembers);

// Remove a member from a group
router.delete("/:groupId/members/:memberId", auth, groupController.removeMember);

// Add admin to a group
router.post("/:groupId/admins/:memberId", auth, groupController.addAdmin);

// Remove admin from a group
router.delete("/:groupId/admins/:adminId", auth, groupController.removeAdmin);

// Get all messages for a group
router.get("/:groupId/messages", auth, groupController.getGroupMessages);

// Leave a group
router.post("/:groupId/leave", auth, groupController.leaveGroup);

module.exports = router; 