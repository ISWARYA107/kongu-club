const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    name: { type: String, default: 'System Administrator' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
