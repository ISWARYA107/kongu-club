const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['club_registration', 'event_registration', 'general'],
      default: 'general',
    },
    reference_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

module.exports = mongoose.model('Notification', notificationSchema);
