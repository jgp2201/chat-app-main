const mongoose = require("mongoose");

const oneToOneMessageSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      to: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      from: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        enum: ["Text", "Media", "Document", "Link", "Reply", "msg"],
      },
      created_at: {
        type: Date,
        default: Date.now(),
      },
      text: {
        type: String,
      },
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
          ref: "OneToOneMessage.messages"
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
    },
  ],
});

const OneToOneMessage = new mongoose.model(
  "OneToOneMessage",
  oneToOneMessageSchema
);
module.exports = OneToOneMessage;
