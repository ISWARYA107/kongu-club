const express = require('express');
const bcrypt = require('bcryptjs');
const Coordinator = require('../models/Coordinator');
const Club = require('../models/Club');
const Event = require('../models/Event');
const ClubRegistration = require('../models/ClubRegistration');
const EventRegistration = require('../models/EventRegistration');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');
const { authenticate, authorize, ownResourceOnly } = require('../middleware/auth');

const router = express.Router();

// ==================== AUTH (public) ====================

// POST /api/coordinator/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const coordinator = await Coordinator.findOne({ email: (email || '').toLowerCase().trim() });
    if (!coordinator) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, coordinator.password);
    if (!match) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: coordinator._id.toString(), role: 'coordinator' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: coordinator._id,
        name: coordinator.name,
        email: coordinator.email,
        club_id: coordinator.club,
        must_change_password: coordinator.must_change_password,
        role: 'coordinator',
      },
    });
  } catch (error) {
    console.error('Coordinator login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Everything below requires a valid coordinator token
router.use(authenticate, authorize('coordinator'));

// POST /api/coordinator/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const coordinator = await Coordinator.findById(req.user.id);

    const match = await bcrypt.compare(current_password, coordinator.password);
    if (!match) {
      return res.json({ success: false, message: 'Current password is incorrect' });
    }

    coordinator.password = await bcrypt.hash(new_password, 10);
    coordinator.must_change_password = false;
    await coordinator.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// GET /api/coordinator/my-club/:coordinator_id
router.get('/my-club/:coordinator_id', ownResourceOnly('coordinator_id'), async (req, res) => {
  try {
    const coordinator = await Coordinator.findById(req.params.coordinator_id).populate('club');

    if (!coordinator || !coordinator.club) {
      return res.json({ success: false, message: 'Club not found for this coordinator' });
    }

    res.json({ success: true, club: coordinator.club });
  } catch (error) {
    console.error('Get coordinator club error:', error);
    res.status(500).json({ success: false, message: 'Failed to load club data' });
  }
});

// GET /api/coordinator/club-members/:club_id (approved members)
router.get('/club-members/:club_id', async (req, res) => {
  try {
    const members = await ClubRegistration.find({ club: req.params.club_id, status: 'approved' })
      .populate('student', 'name college_id email contact department year')
      .sort({ processed_at: -1 });

    const shaped = members.map((m) => ({
      id: m._id,
      student_name: m.student.name,
      college_id: m.student.college_id,
      email: m.student.email,
      contact: m.student.contact,
      department: m.department || m.student.department,
      year: m.year || m.student.year,
      joined_at: m.processed_at,
    }));

    res.json({ success: true, members: shaped });
  } catch (error) {
    console.error('Get club members error:', error);
    res.status(500).json({ success: false, message: 'Failed to load club members' });
  }
});

// GET /api/coordinator/member-count/:club_id
router.get('/member-count/:club_id', async (req, res) => {
  try {
    const member_count = await ClubRegistration.countDocuments({
      club: req.params.club_id,
      status: 'approved',
    });
    res.json({ success: true, member_count });
  } catch (error) {
    console.error('Get member count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get member count' });
  }
});

// GET /api/coordinator/pending-registrations/:club_id
router.get('/pending-registrations/:club_id', async (req, res) => {
  try {
    const registrations = await ClubRegistration.find({ club: req.params.club_id, status: 'pending' })
      .populate('student', 'name college_id email contact')
      .sort({ applied_at: -1 });

    const shaped = registrations.map((r) => ({
      registration_id: r._id,
      student_id: r.student._id,
      student_name: r.student.name,
      college_id: r.student.college_id,
      department: r.department,
      year: r.year,
      contact: r.student.contact,
      email: r.student.email,
      motivation: r.motivation,
      skills: r.skills,
      previous_experience: r.previous_experience,
      applied_at: r.applied_at,
    }));

    res.json({ success: true, registrations: shaped });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pending registrations' });
  }
});

// GET /api/coordinator/pending-event-registrations/:club_id
router.get('/pending-event-registrations/:club_id', async (req, res) => {
  try {
    const clubEvents = await Event.find({ club: req.params.club_id }).select('_id');
    const eventIds = clubEvents.map((e) => e._id);

    const registrations = await EventRegistration.find({ event: { $in: eventIds }, status: 'pending' })
      .populate('student', 'name college_id email department year contact')
      .populate('event', 'event_name event_date event_time venue')
      .sort({ registered_at: -1 });

    const shaped = registrations.map((r) => ({
      registration_id: r._id,
      status: r.status,
      registered_at: r.registered_at,
      student_id: r.student._id,
      student_name: r.student.name,
      college_id: r.student.college_id,
      email: r.student.email,
      department: r.student.department,
      year: r.student.year,
      contact: r.student.contact,
      event_id: r.event._id,
      event_name: r.event.event_name,
      event_date: r.event.event_date,
      event_time: r.event.event_time,
      venue: r.event.venue,
    }));

    res.json({ success: true, registrations: shaped });
  } catch (error) {
    console.error('Get pending event registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pending event registrations' });
  }
});

// POST /api/coordinator/club-registration-action
router.post('/club-registration-action', async (req, res) => {
  try {
    const { registration_id, action } = req.body;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const registration = await ClubRegistration.findByIdAndUpdate(
      registration_id,
      { status: newStatus, processed_at: new Date() },
      { new: true }
    );

    if (!registration) {
      return res.json({ success: false, message: 'Registration not found' });
    }

    res.json({ success: true, message: `Club registration ${newStatus} successfully` });
  } catch (error) {
    console.error('Club registration action error:', error);
    res.status(500).json({ success: false, message: 'Failed to process registration' });
  }
});

// POST /api/coordinator/event-registration-action
router.post('/event-registration-action', async (req, res) => {
  try {
    const { registration_id, action } = req.body;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const registration = await EventRegistration.findByIdAndUpdate(
      registration_id,
      { status: newStatus, reviewed_at: new Date(), reviewed_by: req.user.id },
      { new: true }
    );

    if (!registration) {
      return res.json({ success: false, message: 'Registration not found' });
    }

    res.json({ success: true, message: `Event registration ${newStatus} successfully` });
  } catch (error) {
    console.error('Event registration action error:', error);
    res.status(500).json({ success: false, message: 'Failed to process registration' });
  }
});

// POST /api/coordinator/create-event
router.post('/create-event', async (req, res) => {
  try {
    const { club_id, event_name, event_description, event_date, event_time, venue, max_participants } =
      req.body;

    if (!club_id || !event_name || !event_date) {
      return res.json({ success: false, message: 'Club, event name, and date are required' });
    }

    await Event.create({
      club: club_id,
      event_name,
      event_description,
      event_date,
      event_time,
      venue,
      max_participants: max_participants || null,
      status: 'pending',
    });

    res.json({ success: true, message: 'Event created successfully! Waiting for admin approval.' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

// GET /api/coordinator/my-events/:club_id
router.get('/my-events/:club_id', async (req, res) => {
  try {
    const events = await Event.find({ club: req.params.club_id }).sort({ event_date: -1 });

    const eventsWithCounts = await Promise.all(
      events.map(async (e) => {
        const registrations_count = await EventRegistration.countDocuments({
          event: e._id,
          status: 'approved',
        });
        return {
          id: e._id,
          event_name: e.event_name,
          event_description: e.event_description,
          event_date: e.event_date.toISOString().split('T')[0],
          event_time: e.event_time,
          venue: e.venue,
          max_participants: e.max_participants,
          status: e.status,
          created_at: e.created_at,
          registrations_count,
        };
      })
    );

    res.json({ success: true, events: eventsWithCounts });
  } catch (error) {
    console.error('Get coordinator events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load events' });
  }
});

// GET /api/coordinator/notifications/:coordinator_id
router.get('/notifications/:coordinator_id', ownResourceOnly('coordinator_id'), async (req, res) => {
  try {
    const notifications = await Notification.find({ coordinator: req.params.coordinator_id })
      .sort({ created_at: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
});

// POST /api/coordinator/notifications/mark-read
router.post('/notifications/mark-read', async (req, res) => {
  try {
    const { notification_id } = req.body;
    await Notification.findByIdAndUpdate(notification_id, { is_read: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

module.exports = router;
