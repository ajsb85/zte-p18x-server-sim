// server.js
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import * as mockData from './data/mockData.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
app.use((req, res, _nextUnused) => {
  // Renamed unused 'next'
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  res.status(404).json({
    error: {
      message: error.message,
      status: 404,
    },
  });
});

// General error handler
app.use((error, _reqUnused, res, _nextUnused) => {
  // Renamed unused 'req' and 'next'
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
      status: error.status || 500,
    },
  });
});

import { fileURLToPath } from 'url';
import { resolve } from 'path'; // Removed unused 'dirname'

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
