const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  created_by: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  admins: [{
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  }],
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
    },
    joined_at: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    from: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["Text", "Media", "Document", "Link", "Reply", "msg"],
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    text: String,
    file: {
      url: String,
      originalname: String,
      mimetype: String,
      size: Number
    },
    starred: {
      type: Boolean,
      default: false
    },
    reply: {
      message_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Group.messages"
      },
      text: String,
      from: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      },
      type: {
        type: String,
        enum: ["Text", "Media", "Document", "Link", "msg"]
      },
      subtype: {
        type: String,
        enum: ["Text", "Media", "Document", "Link"]
      },
      file: {
        url: String,
        originalname: String,
        mimetype: String,
        size: Number
      }
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Group = mongoose.model("Group", groupSchema);
module.exports = Group; 