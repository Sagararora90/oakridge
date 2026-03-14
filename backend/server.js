require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());


// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.get('/api/test', (req, res) => res.json({ message: 'API is working' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/user', require('./routes/user'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/notifications', require('./routes/notifications'));

// Catch-all route for 404s
app.use((req, res) => {
  console.log(`404 Error: ${req.method} ${req.url}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  res.status(404).json({ 
    message: `Route ${req.url} not found on this server`,
    method: req.method,
    path: req.url
  });
});


// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
