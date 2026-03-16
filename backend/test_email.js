require('dotenv').config();
const { sendEmailNotification } = require('./services/notificationService');

const testEmail = async () => {
  console.log('--- Email Test Script ---');
  console.log(`Target Email: ${process.env.EMAIL_USER}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Error: EMAIL_USER or EMAIL_PASS not found in .env');
    return;
  }

  await sendEmailNotification(
    process.env.EMAIL_USER,
    'Oakridge Attendance - Test Email',
    'This is a test email to confirm your SMTP settings are working correctly. Great job!'
  );
  
  console.log('Test attempt finished. Check your inbox!');
  process.exit(0);
};

testEmail();
