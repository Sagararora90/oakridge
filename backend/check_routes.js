require('dotenv').config();
const axios = require('axios');

async function repro() {
  // We need a token. I'll try to login or use a fake one if I can bypass auth for test.
  // Actually, I'll just check if the route is registered in express.
  const express = require('express');
  const router = require('./routes/subjects');
  const app = express();
  app.use('/api/subjects', router);

  const stack = app._router.stack;
  console.log('Routes registered:');
  stack.forEach(r => {
    if (r.route) {
        console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
    } else if (r.name === 'router') {
        r.handle.stack.forEach(sr => {
            if (sr.route) {
                console.log(`${Object.keys(sr.route.methods)} ${sr.route.path}`);
            }
        });
    }
  });
}

repro();
