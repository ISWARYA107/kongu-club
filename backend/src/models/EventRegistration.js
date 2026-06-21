const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    registered_at: { type: Date, default: Date.now },
    reviewed_at: { type: Date, default: null },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator', default: null },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

eventRegistrationSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
