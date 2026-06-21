// Run with: npm run seed
// Creates a default admin account (and, if the DB is empty, a couple of
// sample clubs/coordinators/students) so you have something to log in
// with right after setup.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Club = require('../models/Club');
const Coordinator = require('../models/Coordinator');
const Student = require('../models/Student');

async function seed() {
  await connectDB();

  // --- Default admin ---
  const adminExists = await Admin.findOne({ username: 'admin' });
  if (!adminExists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ username: 'admin', password: hashed, name: 'System Administrator' });
    console.log('✅ Created default admin -> username: admin / password: admin123');
  } else {
    console.log('ℹ️  Admin "admin" already exists, skipping.');
  }

  // --- Sample club + coordinator + student (only if collections are empty) ---
  const clubCount = await Club.countDocuments();
  if (clubCount === 0) {
    const club = await Club.create({
      club_name: 'Coding Club',
      faculty_coordinator: 'Dr. John Smith',
      faculty_contact: 'john@kongu.edu',
      student_secretary: 'Alice Johnson',
      category: 'Technical',
      description: 'Programming and software development club',
    });

    const coordPassword = await bcrypt.hash('kongu123', 10);
    await Coordinator.create({
      name: 'Dr. John Smith',
      email: 'john@kongu.edu',
      password: coordPassword,
      contact: '9876543210',
      emp_id: 'EMP001',
      club: club._id,
      must_change_password: true,
    });

    const studentPassword = await bcrypt.hash('password123', 10);
    await Student.create({
      college_id: '21cse001@kongu.edu',
      name: 'Test Student',
      password: studentPassword,
      department: 'CSE',
      year: '3',
      contact: '9999999999',
      email: '21cse001@kongu.edu',
    });

    console.log('✅ Created sample club "Coding Club"');
    console.log('   Coordinator login -> john@kongu.edu / kongu123');
    console.log('   Student login     -> 21cse001@kongu.edu / password123');
  } else {
    console.log('ℹ️  Clubs already exist, skipping sample data.');
  }

  console.log('🌱 Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
