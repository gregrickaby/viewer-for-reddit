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
sonar-scanner

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SonarQube analysis complete!"
else
  echo ""
  echo "❌ SonarQube analysis failed"
  exit 1
fi
