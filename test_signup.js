const axios = require('axios');

async function testSignup() {
  try {
    const res = await axios.post('http://localhost:5001/api/auth/signup', {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });
    console.log('Signup Success:', res.data);
  } catch (err) {
    console.error('Signup Failed:', err.response ? err.response.data : err.message);
  }
}

testSignup();
