#!/bin/bash

# SonarQube Analysis Script
# Runs test coverage generation followed by SonarQube analysis

echo "📊 Running test coverage..."
npm run test:coverage

# Store coverage exit code but continue
COVERAGE_EXIT=$?
if [ $COVERAGE_EXIT -ne 0 ]; then
  echo "⚠️  Coverage exited with code $COVERAGE_EXIT (continuing anyway)"
fi

echo ""
echo "🔍 Starting SonarQube analysis..."

# Read SonarQube token from file
if [ ! -f ".sonar_token" ]; then
  echo "❌ Error: .sonar_token file not found"
  echo "Create a .sonar_token file with your SonarQube token"
  exit 1
fi

SONAR_TOKEN=$(cat .sonar_token | tr -d '\n\r')

sonar-scanner \
  -Dsonar.projectKey=viewer-for-reddit \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token="${SONAR_TOKEN}"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SonarQube analysis complete!"
else
  echo ""
  echo "❌ SonarQube analysis failed"
  exit 1
fi
