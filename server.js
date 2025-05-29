// server.js
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const apiRoutes = require('./routes/api'); // Ensure this path is correct and api.js exports a router

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // HTTP request logger
app.use(bodyParser.urlencoded({ extended: false })); // for application/x-www-form-urlencoded
app.use(bodyParser.json()); // for application/json

// CORS Middleware (allow all for simulation)
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

// API Routes
// This is the critical part for your /goform/... routes
// It tells Express to use the router defined in routes/api.js for any requests to '/'
// The paths within routes/api.js will be relative to this mount point.
app.use('/', apiRoutes);

// Special route for version file (as seen in wui.txt)
// This route is defined directly on the app object.
const mockData = require('./data/mockData');
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
    // This ensures a specific response if version_info is not found, rather than a generic 404 from this handler
    res
      .status(404)
      .type('text/plain')
      .send('version_info_not_found_in_mockData_for_specific_route');
  }
});

// Simple 404 error handler (if no routes above matched)
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// General error handler (catches errors passed by next(error))
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
      status: error.status || 500,
    },
  });
});

// Start server only if this script is run directly (not required by a test runner)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ZTE P18X API Simulator running on http://localhost:${PORT}`);
    console.log('Available API endpoints:');
    console.log('  GET  /goform/goform_get_cmd_process?cmd=...');
    console.log(
      '  POST /goform/goform_set_cmd_process (with goformId in body)'
    );
    console.log('  GET  /zte_web/web/version');
    // For debugging, you can log the routes Express knows about after setup
    // console.log('Registered routes:', app._router.stack.filter(r => r.route).map(r => ({ path: r.route.path, methods: r.route.methods })));
  });
}

module.exports = app; // Export for testing
