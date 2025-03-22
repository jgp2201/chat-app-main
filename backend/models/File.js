const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const File = new mongoose.model("File", fileSchema);
module.exports = File; 