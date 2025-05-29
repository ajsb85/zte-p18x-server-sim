// server.js
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import * as mockData from './data/mockData.js';
import querystring from 'querystring'; // Import querystring module

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));

// Standard body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Custom middleware to handle text/plain as URL-encoded
app.use((req, res, next) => {
  if (req.is('text/plain') && req.method === 'POST') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        // Attempt to parse as URL-encoded query string
        req.body = querystring.parse(data);
        console.log('Parsed text/plain as URL-encoded body:', req.body);
      } catch (e) {
        console.error('Error parsing text/plain body:', e);
        // If parsing fails, leave req.body as is (or set to empty object)
        // req.body will likely be undefined or an empty object from previous parsers
      }
      next();
    });
  } else {
    next();
  }
});

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

app.use('/', apiRoutes);

app.get('/zte_web/web/version', (req, res) => {
  const versionInfo = mockData.getState('version_info');
  if (
    versionInfo &&
    versionInfo.software_version &&
    versionInfo.inner_software_version
  ) {
    res
      .type('text/plain')
      .send(
        `software_version=${versionInfo.software_version}\ninner_software_version=${versionInfo.inner_software_version}`
      );
  } else {
    res
      .status(404)
      .type('text/plain')
      .send('version_info_not_found_in_mockData_for_specific_route');
  }
});

// Simple 404 error handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// General error handler
app.use((error, req, res, _nextUnused) => {
  console.error('General Error Handler Caught:', error.stack || error);
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message || 'Internal Server Error',
      status: error.status || 500,
    },
  });
});

import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule =
  process.argv[1] === __filename || process.argv[1] === resolve(__filename);

if (process.env.NODE_ENV !== 'test' && isMainModule) {
  app.listen(PORT, () => {
    console.log(`ZTE P18X API Simulator running on http://localhost:${PORT}`);
    console.log('Available API endpoints:');
    console.log('  GET  /goform/goform_get_cmd_process?cmd=...');
    console.log(
      '  POST /goform/goform_set_cmd_process (with goformId in body)'
    );
    console.log('  GET  /zte_web/web/version');
  });
}

export default app;
