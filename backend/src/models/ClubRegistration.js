const mongoose = require('mongoose');

// NOTE ON DESIGN:
// The original MySQL schema tracked club membership across three separate
// tables (club_registrations, student_clubs, club_members) that were kept
// in sync manually. That's a common source of bugs (and the original
// server.js had to update two tables every time a registration was
// approved). Here, a single status field does the same job:
//   status: 'pending'  -> application awaiting coordinator review
//   status: 'approved' -> the student is a club member
//   status: 'rejected' -> application was declined
const clubRegistrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    section: { type: String, default: '' },
    skills: { type: String, default: '' },
    previous_experience: { type: String, default: '' },
    motivation: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    applied_at: { type: Date, default: Date.now },
    processed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

// A student can only have one registration record per club
clubRegistrationSchema.index({ student: 1, club: 1 }, { unique: true });

module.exports = mongoose.model('ClubRegistration', clubRegistrationSchema);
