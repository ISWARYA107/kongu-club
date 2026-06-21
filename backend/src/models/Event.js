const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    event_name: { type: String, required: true, trim: true },
    event_description: { type: String, default: '' },
    event_date: { type: Date, required: true },
    event_time: { type: String, default: '' },
    venue: { type: String, default: '' },
    max_participants: { type: Number, default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Event', eventSchema);
