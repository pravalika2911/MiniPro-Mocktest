const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@sentinel.edu',
      password: 'password123',
      portalRole: 'admin'
    });
    console.log("LOGIN SUCCESS:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("LOGIN FAILED:", err.response.status, err.response.data);
    } else {
      console.log("NETWORK ERROR:", err.message);
    }
  }
}

testLogin();
