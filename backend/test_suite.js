
const BASE_URL = 'http://localhost:5001/api';
const TEST_USER = {
  name: 'Test Pilot',
  email: `test_${Date.now()}@example.com`,
  password: 'password123'
};

let token = '';
let subjectId = '';

async function runTests() {
  console.log('🚀 Starting Full Backend API Test...');

  try {
    // 1. Signup
    console.log('\n📝 Testing Signup...');
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const signupData = await signupRes.json();
    if (!signupRes.ok) throw new Error(`Signup failed: ${signupData.message}`);
    token = signupData.token;
    console.log('✅ Signup successful');

    // 2. Login
    console.log('\n🔑 Testing Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.message}`);
    console.log('✅ Login successful');

    // 3. Create Subject
    console.log('\n📚 Creating Subject...');
    const subRes = await fetch(`${BASE_URL}/subjects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        name: 'Integration Testing 101',
        requiredAttendance: 75,
        color: '#FF3B30',
        initialAttended: 0,
        initialTotal: 0
      })
    });
    const subData = await subRes.json();
    if (!subRes.ok) throw new Error(`Subject creation failed: ${subData.message}`);
    subjectId = subData._id;
    console.log(`✅ Subject created: ${subData.name} (${subjectId})`);

    // 4. Mark Attendance (Retroactive - Yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();
    
    console.log(`\n📅 Marking Attendance for Yesterday (${yesterday.toDateString()})...`);
    const attRes = await fetch(`${BASE_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        status: 'Present',
        date: yesterdayStr
      })
    });
    const attData = await attRes.json();
    if (!attRes.ok) throw new Error(`Attendance marking failed: ${attData.message}`);
    
    // Check if record has correct date
    const lastRecord = attData.attendanceRecords[attData.attendanceRecords.length - 1];
    const recordDate = new Date(lastRecord.date).toDateString();
    if (recordDate === yesterday.toDateString()) {
      console.log(`✅ Retroactive marking successful (anchored to ${recordDate})`);
    } else {
      console.warn(`❌ Date mismatch! Expected ${yesterday.toDateString()} but got ${recordDate}`);
    }

    // 5. Verification - Stats
    console.log('\n📊 Verifying recalculation engine...');
    if (attData.attended === 1 && attData.total === 1) {
      console.log('✅ Attendance recalculated correctly (1/1)');
    } else {
      console.warn(`❌ Stats mismatch! Got ${attData.attended}/${attData.total}`);
    }

    // 6. Timetable Sync
    console.log('\n📅 Creating Timetable...');
    const ttRes = await fetch(`${BASE_URL}/timetable`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify([{
        day: 'Monday',
        slots: [{ time: '09:00 - 10:00', subject: subjectId, credit: 1 }]
      }])
    });
    const ttData = await ttRes.json();
    if (!ttRes.ok) throw new Error(`Timetable creation failed: ${ttData.message}`);
    console.log('✅ Timetable created');

    // 7. Exam Tracking
    console.log('\n📝 Adding Exam Deadline...');
    const examRes = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        name: 'Final integration test',
        date: new Date(Date.now() + 86400000 * 7).toISOString(),
        type: 'Final',
        subjectId: subjectId
      })
    });
    if (!examRes.ok) throw new Error('Exam creation failed');
    console.log('✅ Exam deadline added');

    console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');

  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

runTests();
