require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { middleware: openapiValidator } = require('express-openapi-validator');
const { supabase } = require('./supabase');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Attach user if Authorization header present
app.use(async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token && supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data && data.user) {
        req.user = data.user;
      }
    }
  } catch (err) {
    // Non-fatal; proceed without user
  } finally {
    next();
  }
});

// OpenAPI validation
const apiSpecPath = path.resolve(__dirname, '../berry-buddy-openapi.yaml');
app.use(openapiValidator({ apiSpec: apiSpecPath, validateRequests: true, validateResponses: false }));

// Routes
app.use('/', require('./routes/health'));
app.use('/auth', require('./routes/auth'));
app.use('/berries', require('./routes/berries'));
app.use('/vendors', require('./routes/vendors'));
app.use('/profiles', require('./routes/profiles'));
app.use('/prices', require('./routes/prices'));
app.use('/reviews', require('./routes/reviews'));
app.use('/photos', require('./routes/photos'));

// Not found handler (let OpenAPI validator handle unknown routes too)
app.use((req, res, next) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Resource not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: err.name || 'Error', message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Berry Buddy API listening on http://localhost:${port}`);
});

