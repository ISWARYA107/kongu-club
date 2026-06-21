const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Club = require('../models/Club');
const Coordinator = require('../models/Coordinator');
const Student = require('../models/Student');
const Event = require('../models/Event');
const ClubRegistration = require('../models/ClubRegistration');
const generateToken = require('../utils/generateToken');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ==================== AUTH (public) ====================

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: 'Please enter username and password' });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    const token = generateToken({ id: admin._id.toString(), role: 'admin' });

    res.json({
      success: true,
      message: 'Admin login successful!',
      token,
      user: { id: admin._id, username: admin.username, role: 'admin', name: admin.name },
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Everything below this line requires a valid admin token
router.use(authenticate, authorize('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalClubs, totalEvents, pendingEvents, totalStudents, totalCoordinators] = await Promise.all([
      Club.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: 'pending' }),
      Student.countDocuments(),
      Coordinator.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: {
        total_clubs: totalClubs,
        total_events: totalEvents,
        pending_events: pendingEvents,
        total_students: totalStudents,
        total_coordinators: totalCoordinators,
      },
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

// GET /api/admin/clubs
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ club_name: 1 });
    res.json({ success: true, clubs });
  } catch (error) {
    console.error('❌ Get admin clubs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load clubs' });
  }
});

// POST /api/admin/add-club
router.post('/add-club', async (req, res) => {
  try {
    const {
      club_name,
      faculty_coordinator,
      faculty_contact,
      student_secretary,
      student_rollno,
      student_contact,
      description,
      category,
    } = req.body;

    if (!club_name) {
      return res.json({ success: false, message: 'Club name is required' });
    }

    await Club.create({
      club_name,
      faculty_coordinator,
      faculty_contact,
      student_secretary,
      student_rollno,
      student_contact,
      description,
      category,
    });

    res.json({ success: true, message: 'Club added successfully!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: false, message: 'A club with this name already exists' });
    }
    console.error('❌ Add club error:', error);
    res.status(500).json({ success: false, message: 'Failed to add club' });
  }
});

// GET /api/admin/coordinators
router.get('/coordinators', async (req, res) => {
  try {
    const coordinators = await Coordinator.find().populate('club', 'club_name').sort({ name: 1 });

    const shaped = coordinators.map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      contact: c.contact,
      emp_id: c.emp_id,
      club_name: c.club ? c.club.club_name : null,
      status: c.status,
      created_at: c.created_at,
    }));

    res.json({ success: true, coordinators: shaped });
  } catch (error) {
    console.error('❌ Get coordinators error:', error);
    res.status(500).json({ success: false, message: 'Failed to load coordinators' });
  }
});

// POST /api/admin/add-coordinator
router.post('/add-coordinator', async (req, res) => {
  try {
    const { name, email, contact, emp_id, club_id, notes } = req.body;

    if (!name || !email || !club_id) {
      return res.json({ success: false, message: 'Name, email, and club are required' });
    }

    const defaultPassword = 'kongu123';
    const hashed = await bcrypt.hash(defaultPassword, 10);

    await Coordinator.create({
      name,
      email,
      contact,
      emp_id,
      club: club_id,
      notes,
      password: hashed,
      must_change_password: true,
    });

    res.json({
      success: true,
      message: 'Coordinator added successfully! Default password: kongu123',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: false, message: 'A coordinator with this email already exists' });
    }
    console.error('❌ Add coordinator error:', error);
    res.status(500).json({ success: false, message: 'Failed to add coordinator' });
  }
});

// DELETE /api/admin/delete-coordinator/:id
router.delete('/delete-coordinator/:id', async (req, res) => {
  try {
    await Coordinator.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coordinator deleted successfully' });
  } catch (error) {
    console.error('❌ Delete coordinator error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coordinator' });
  }
});

// GET /api/admin/events (most recent 10, any status)
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().populate('club', 'club_name').sort({ created_at: -1 }).limit(10);

    const shaped = events.map((e) => ({
      id: e._id,
      event_name: e.event_name,
      club_name: e.club ? e.club.club_name : 'Unknown club',
      status: e.status,
      created_at: e.created_at,
    }));

    res.json({ success: true, events: shaped });
  } catch (error) {
    console.error('❌ Get admin events error:', error);
    res.json({ success: true, events: [] });
  }
});

// GET /api/admin/pending-events
router.get('/pending-events', async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .populate('club', 'club_name faculty_coordinator')
      .sort({ created_at: -1 });

    const shaped = events.map((e) => ({
      id: e._id,
      event_name: e.event_name,
      club_name: e.club ? e.club.club_name : 'Unknown club',
      faculty_coordinator: e.club ? e.club.faculty_coordinator : '',
      event_date: e.event_date.toISOString().split('T')[0],
      event_time: e.event_time,
      venue: e.venue,
      event_description: e.event_description,
      max_participants: e.max_participants,
      status: e.status,
    }));

    res.json({ success: true, events: shaped });
  } catch (error) {
    console.error('❌ Get pending events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pending events' });
  }
});

// POST /api/admin/event-approval
router.post('/event-approval', async (req, res) => {
  try {
    const { event_id, action } = req.body;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await Event.findByIdAndUpdate(event_id, { status: newStatus, reviewed_at: new Date() });

    res.json({ success: true, message: `Event ${newStatus} successfully` });
  } catch (error) {
    console.error('❌ Event approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to process event approval' });
  }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().select('-password').sort({ name: 1 });
    res.json({ success: true, students });
  } catch (error) {
    console.error('❌ Get students error:', error);
    res.status(500).json({ success: false, message: 'Failed to load students' });
  }
});

// GET /api/admin/club-member-counts - bonus endpoint: total members per club, for the "Statistics" tab
router.get('/club-member-counts', async (req, res) => {
  try {
    const counts = await ClubRegistration.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$club', member_count: { $sum: 1 } } },
    ]);
    res.json({ success: true, counts });
  } catch (error) {
    console.error('❌ Club member counts error:', error);
    res.status(500).json({ success: false, message: 'Failed to load member counts' });
  }
});

module.exports = router;
