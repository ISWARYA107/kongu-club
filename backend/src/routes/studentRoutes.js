const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Club = require('../models/Club');
const Coordinator = require('../models/Coordinator');
const Event = require('../models/Event');
const ClubRegistration = require('../models/ClubRegistration');
const EventRegistration = require('../models/EventRegistration');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');
const { authenticate, authorize, ownResourceOnly } = require('../middleware/auth');

const router = express.Router();

// ==================== AUTH (public) ====================

// POST /api/student/register
// (The original app referenced this endpoint from the UI but never implemented it -
// students had to be inserted into MySQL by hand. It's wired up properly here.)
router.post('/register', async (req, res) => {
  try {
    const { college_id, name, department, year, password, contact, email } = req.body;

    if (!college_id || !name || !password) {
      return res.json({ success: false, message: 'College ID, name, and password are required' });
    }

    const existing = await Student.findOne({ college_id: college_id.trim() });
    if (existing) {
      return res.json({ success: false, message: 'An account with this College ID already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({
      college_id: college_id.trim(),
      name,
      department,
      year,
      contact,
      email,
      password: hashed,
    });

    res.json({
      success: true,
      message: 'Registration successful! Please login.',
      user: { id: student._id, college_id: student.college_id, name: student.name },
    });
  } catch (error) {
    console.error('Student register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/student/login
router.post('/login', async (req, res) => {
  try {
    const { college_id, password } = req.body;

    const student = await Student.findOne({ college_id: (college_id || '').trim() });
    if (!student) {
      return res.json({ success: false, message: 'Student not found' });
    }

    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return res.json({ success: false, message: 'Invalid password' });
    }

    const token = generateToken({ id: student._id.toString(), role: 'student' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: student._id,
        college_id: student.college_id,
        name: student.name,
        department: student.department,
        year: student.year,
        contact: student.contact,
        email: student.email,
        role: 'student',
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Everything below requires a valid student token
router.use(authenticate, authorize('student'));

// POST /api/student/register-club
router.post('/register-club', async (req, res) => {
  try {
    const { student_id, club_id, department, academic_year, section, skills, previous_experience, motivation } =
      req.body;

    if (student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only register yourself.' });
    }

    const existing = await ClubRegistration.findOne({ student: student_id, club: club_id });
    if (existing) {
      return res.json({ success: false, message: 'Already registered for this club' });
    }

    const student = await Student.findById(student_id);
    if (!student) {
      return res.json({ success: false, message: 'Student not found' });
    }

    await ClubRegistration.create({
      student: student_id,
      club: club_id,
      department,
      year: academic_year,
      section,
      skills,
      previous_experience,
      motivation,
      status: 'pending',
    });

    // Notify the club's coordinator
    const coordinator = await Coordinator.findOne({ club: club_id });
    if (coordinator) {
      const club = await Club.findById(club_id);
      await Notification.create({
        coordinator: coordinator._id,
        title: 'New Club Registration',
        message: `Student ${student.name} (${student.college_id}) wants to join ${club ? club.club_name : 'your club'}`,
        type: 'club_registration',
        reference_id: club_id,
      });
    }

    res.json({ success: true, message: 'Club registration submitted. Waiting for coordinator approval.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: false, message: 'Already registered for this club' });
    }
    console.error('Register club error:', error);
    res.status(500).json({ success: false, message: 'Failed to register for club' });
  }
});

// GET /api/student/my-clubs/:student_id
router.get('/my-clubs/:student_id', ownResourceOnly('student_id'), async (req, res) => {
  try {
    const registrations = await ClubRegistration.find({ student: req.params.student_id })
      .populate('club')
      .sort({ applied_at: -1 });

    const clubs = registrations
      .filter((r) => r.club)
      .map((r) => ({
        ...r.club.toObject(),
        id: r.club._id,
        status: r.status,
        registered_at: r.applied_at,
      }));

    res.json({ success: true, clubs });
  } catch (error) {
    console.error('Get my clubs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load your clubs' });
  }
});

// GET /api/student/my-events/:student_id
router.get('/my-events/:student_id', ownResourceOnly('student_id'), async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ student: req.params.student_id })
      .populate({ path: 'event', populate: { path: 'club', select: 'club_name faculty_coordinator' } })
      .sort({ registered_at: -1 });

    const events = registrations
      .filter((r) => r.event)
      .map((r) => ({
        id: r.event._id,
        event_name: r.event.event_name,
        event_date: r.event.event_date,
        event_time: r.event.event_time,
        venue: r.event.venue,
        club_name: r.event.club ? r.event.club.club_name : '',
        faculty_coordinator: r.event.club ? r.event.club.faculty_coordinator : '',
        status: r.status,
        registered_at: r.registered_at,
      }));

    res.json({ success: true, events });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load your events' });
  }
});

// POST /api/student/register-event
router.post('/register-event', async (req, res) => {
  try {
    const { student_id, event_id } = req.body;

    if (student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only register yourself.' });
    }

    const existing = await EventRegistration.findOne({ student: student_id, event: event_id });
    if (existing) {
      return res.json({ success: false, message: 'Already registered for this event' });
    }

    await EventRegistration.create({ student: student_id, event: event_id, status: 'pending' });

    // Notify the coordinator of the event's club
    const event = await Event.findById(event_id).populate('club');
    if (event && event.club) {
      const coordinator = await Coordinator.findOne({ club: event.club._id });
      const student = await Student.findById(student_id);

      if (coordinator && student) {
        await Notification.create({
          coordinator: coordinator._id,
          title: 'New Event Registration',
          message: `Student ${student.name} (${student.college_id}) has registered for event "${event.event_name}"`,
          type: 'event_registration',
          reference_id: event_id,
        });
      }
    }

    res.json({ success: true, message: 'Event registration submitted. Waiting for coordinator approval.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: false, message: 'Already registered for this event' });
    }
    console.error('Register event error:', error);
    res.status(500).json({ success: false, message: 'Failed to register for event' });
  }
});

module.exports = router;
