#!/bin/bash

# Script to run Postman tests using Newman

COLLECTION_FILE="postman/ZTE_P18X_Simulator_Postman_Collection.json"
ENVIRONMENT_FILE="postman/environment/zte_simulator.postman_environment.json"
REPORTS_DIR="postman/reports"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

echo "Running Postman collection: $COLLECTION_FILE"
echo "Using environment: $ENVIRONMENT_FILE"

# Run Newman tests with HTML and JUnit reporters
npx newman run "$COLLECTION_FILE" \
    -e "$ENVIRONMENT_FILE" \
    --reporters cli,html,junit \
    --reporter-html-export "$REPORTS_DIR/zte_sim_report.html" \
    --reporter-junit-export "$REPORTS_DIR/zte_sim_report.xml"

# Check exit code of Newman
if [ $? -eq 0 ]; then
    echo "Newman tests completed successfully."
    echo "HTML Report: $REPORTS_DIR/zte_sim_report.html"
    echo "JUnit Report: $REPORTS_DIR/zte_sim_report.xml"
else
    echo "Newman tests failed."
    exit 1
fi

exit 0
