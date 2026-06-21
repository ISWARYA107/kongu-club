const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    college_id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Student', studentSchema);
