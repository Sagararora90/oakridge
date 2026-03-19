const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AttendanceRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Present', 'Absent', 'Skip', 'OD', 'Medical', 'Cancelled'], required: true },
  credit: { type: Number, default: 1 }
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  requiredAttendance: { type: Number, default: 75 },
  attended: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  initialAttended: { type: Number, default: 0 },
  initialTotal: { type: Number, default: 0 },
  initialDate: { type: Date, default: null }, // The date the initial attendance figures were valid as of
  odCount: { type: Number, default: 0 },
  medicalCount: { type: Number, default: 0 },
  color: { type: String, default: '#3b82f6' }, // Default blue
  attendanceRecords: [AttendanceRecordSchema]
});

const TimetableSchema = new mongoose.Schema({
  day: { type: String, required: true }, // Monday, Tuesday, etc.
  slots: [{
    time: { type: String, required: true }, // e.g., "09:00 - 10:00"
    subject: { type: mongoose.Schema.Types.ObjectId },
    credit: { type: Number, default: 1 } // Used for weighted attendance calculation based on duration
  }]
});

const ExamSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['Midterm', 'Final', 'Quiz', 'Assignment', 'Exam'], default: 'Exam' }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subjects: [SubjectSchema],
  timetable: [TimetableSchema],
  exams: [ExamSchema],
  holidays: [{ date: { type: Date }, label: { type: String, default: 'Holiday' } }],
  extraClasses: [{ date: { type: Date }, followsDay: { type: String } }],
  streak: { type: Number, default: 0 },
  lastAttendanceDate: { type: Date, default: null },
  badges: [{ name: String, icon: String, earnedAt: { type: Date, default: Date.now } }],
  semesterEndDate: { type: Date, default: null },
  notifications: [{
    title: String,
    message: String,
    type: { type: String, enum: ['Attendance', 'Exam', 'System', 'Achievement'], default: 'System' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  notificationSettings: {
    emailEnabled: { type: Boolean, default: false },
    notificationEmail: { type: String, default: null },
    reminderTime: { type: Number, default: 15 }, // Minutes before class start
    sentNotifications: { type: [String], default: [] } // format: "YYYY-MM-DD_slotId"
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
