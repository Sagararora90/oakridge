const axios = require('axios');

/**
 * Send a notification to Discord via Webhook
 * @param {string} webhookUrl 
 * @param {object} message 
 */
const nodemailer = require('nodemailer');

/**
 * Send an email notification
 */
const sendEmailNotification = async (to, subject, text) => {
  try {
    // Check if SMTP is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[EMAIL SKIP] SMTP credentials not found in .env');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Oakridge Attendance" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Sent to: ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
  }
};

/**
 * Check all users and send notifications for upcoming classes
 */
const checkAndSendNotifications = async (User) => {
  try {
    const users = await User.find({
      'notificationSettings.emailEnabled': true
    });

    const now = new Date();
    const todayLabel = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayStr = now.toISOString().split('T')[0];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (const user of users) {
      const settings = user.notificationSettings;
      const todayTimetable = user.timetable?.find(t => t.day.toLowerCase() === todayLabel.toLowerCase());
      
      if (!todayTimetable || !todayTimetable.slots) continue;

      let userUpdated = false;
      const targetEmail = settings.notificationEmail || user.email;

      for (const slot of todayTimetable.slots) {
        if (!slot.time || !slot.time.includes('-')) continue;

        const startTimeStr = slot.time.split('-')[0].trim();
        const startMins = parseTimeToMinutes(startTimeStr);
        if (!startMins) continue;

        const reminderWindow = settings.reminderTime || 15;
        const isTimeForAlert = currentMins >= (startMins - reminderWindow) && currentMins < startMins;

        if (isTimeForAlert) {
          const slotKey = `${todayStr}_${slot._id || slot.time}`;
          
          if (user.notificationSettings.sentNotifications.includes(slotKey)) continue;

          // Find subject name
          const subject = user.subjects.id(slot.subject);
          const subjectName = subject ? subject.name : 'Unknown Subject';

          // Send Email
          if (settings.emailEnabled && targetEmail) {
            await sendEmailNotification(
              targetEmail, 
              `Upcoming Class: ${subjectName}`, 
              `Hi ${user.name || 'Scholar'},\n\nYour class ${subjectName} starts at ${startTimeStr}.\n\nStay on top of your attendance!`
            );
          }

          user.notificationSettings.sentNotifications.push(slotKey);
          userUpdated = true;
        }
      }

      // Cleanup old notifications (older than today)
      if (user.notificationSettings.sentNotifications.length > 50) {
        user.notificationSettings.sentNotifications = user.notificationSettings.sentNotifications.filter(key => key.startsWith(todayStr));
        userUpdated = true;
      }

      if (userUpdated) {
        await user.save();
      }
    }
  } catch (err) {
    console.error('Error in checkAndSendNotifications:', err);
  }
};

// Helper from TheOracle.jsx logic
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let [_, hours, mins, modifier] = match;
  hours = parseInt(hours, 10);
  mins = parseInt(mins, 10);

  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + mins;
};

module.exports = {
  sendEmailNotification,
  checkAndSendNotifications
};
