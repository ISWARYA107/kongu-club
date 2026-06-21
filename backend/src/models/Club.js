const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    club_name: { type: String, required: true, unique: true, trim: true },
    faculty_coordinator: { type: String, default: '' },
    faculty_contact: { type: String, default: '' },
    student_secretary: { type: String, default: '' },
    student_rollno: { type: String, default: '' },
    student_contact: { type: String, default: '' },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Professional', 'Legal', 'General'],
      default: 'General',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Club', clubSchema);
