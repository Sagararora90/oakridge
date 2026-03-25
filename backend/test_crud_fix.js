require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testCRUD() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const user = await User.findOne();
    if (!user) {
      console.log('No user found to test');
      return;
    }

    if (!user.subjects || user.subjects.length === 0) {
      console.log('User has no subjects to test');
      return;
    }

    const subject = user.subjects[0];
    console.log(`Testing with subject: ${subject.name}`);

    // 1. Add a log
    const testDate = new Date('2026-03-25');
    subject.attendanceRecords.push({ date: testDate, status: 'Present', credit: 1 });
    await user.save();
    console.log('Added log entry');

    // Find the added log
    const freshUser = await User.findById(user._id);
    const freshSubject = freshUser.subjects.id(subject._id);
    const logEntry = freshSubject.attendanceRecords.find(r => r.date.toISOString().split('T')[0] === '2026-03-25');
    
    if (!logEntry) throw new Error('Log entry not found after save');
    console.log('Found log entry:', logEntry._id);

    // 2. Edit log
    logEntry.status = 'Absent';
    await freshUser.save();
    console.log('Edited log entry to Absent');

    // 3. Delete log using pull
    const finalUser = await User.findById(user._id);
    const finalSubject = finalUser.subjects.id(subject._id);
    finalSubject.attendanceRecords.pull(logEntry._id);
    await finalUser.save();
    console.log('Deleted log entry using pull');

    const deletedCheck = await User.findById(user._id);
    const deletedSubject = deletedCheck.subjects.id(subject._id);
    const stillExists = deletedSubject.attendanceRecords.id(logEntry._id);
    
    if (stillExists) {
      console.error('FAILED: Log entry still exists');
    } else {
      console.log('SUCCESS: CRUD test passed');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
}

testCRUD();
