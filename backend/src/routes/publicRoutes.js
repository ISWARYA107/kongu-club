const express = require('express');
const Club = require('../models/Club');
const Event = require('../models/Event');

const router = express.Router();

// GET /api/clubs
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ club_name: 1 });
    res.json({ success: true, clubs });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load clubs' });
  }
});

// GET /api/clubs/:id
router.get('/clubs/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.json({ success: false, message: 'Club not found' });
    }
    res.json({ success: true, club });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({ success: false, message: 'Failed to load club details' });
  }
});

// GET /api/events/club/:club_id (approved events for a specific club)
router.get('/events/club/:club_id', async (req, res) => {
  try {
    const events = await Event.find({ club: req.params.club_id, status: 'approved' })
      .populate('club', 'club_name faculty_coordinator')
      .sort({ event_date: -1 });

    const shaped = events.map((e) => ({
      id: e._id,
      event_name: e.event_name,
      event_description: e.event_description,
      event_date: e.event_date,
      event_time: e.event_time,
      venue: e.venue,
      max_participants: e.max_participants,
      club_name: e.club ? e.club.club_name : '',
      faculty_coordinator: e.club ? e.club.faculty_coordinator : '',
    }));

    res.json({ success: true, events: shaped });
  } catch (error) {
    console.error('Get club events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load club events' });
  }
});

// GET /api/events/approved (all approved, upcoming-or-not, events across clubs)
router.get('/events/approved', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('club', 'club_name faculty_coordinator')
      .sort({ event_date: -1 });

    const shaped = events.map((e) => ({
      id: e._id,
      event_name: e.event_name,
      event_description: e.event_description,
      event_date: e.event_date,
      event_time: e.event_time,
      venue: e.venue,
      max_participants: e.max_participants,
      club_name: e.club ? e.club.club_name : '',
      faculty_coordinator: e.club ? e.club.faculty_coordinator : '',
    }));

    res.json({ success: true, events: shaped });
  } catch (error) {
    console.error('Get approved events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load events' });
  }
});

module.exports = router;
