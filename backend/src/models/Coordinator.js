const mongoose = require('mongoose');

const coordinatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, default 'kongu123'
    contact: { type: String, default: '' },
    emp_id: { type: String, default: '' },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    must_change_password: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Coordinator', coordinatorSchema);
