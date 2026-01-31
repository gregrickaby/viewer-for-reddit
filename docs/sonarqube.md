# SonarQube Setup & Maintenance

This document covers the SonarQube Community Edition setup for the Reddit Viewer project.

## Overview

**Why SonarQube?**

- Static code analysis for code quality and security
- Tracks technical debt and code smells
- Enforces quality gates before merging
- Historical tracking of code metrics

**Current Setup:**

- **Version**: SonarQube Community Edition 26.1.0.118079 (latest as of Jan 2026)
- **Runtime**: Docker container with named volumes
- **Database**: Embedded H2 (sufficient for single-project use)
- **Search**: Embedded Elasticsearch 8.19.8
- **URL**: http://localhost:9000

## Quick Start

### Starting SonarQube

```bash
docker start sonarqube
```

Wait ~30 seconds for startup, then visit http://localhost:9000

### Stopping SonarQube

```bash
docker stop sonarqube
```

### Running Analysis

From project root:

```bash
npm run sonar
```

**Note**: Analysis takes ~6 minutes. SonarQube must be running before executing.

## Docker Configuration

### Current Container Setup

```bash
Container: sonarqube
Image: sonarqube:community
Port: 9000 (host) → 9000 (container)
Status: Persistent (restarts unless stopped)
```

### Named Volumes

```
sonarqube_data       - Database & Elasticsearch data (CRITICAL)
sonarqube_extensions - Plugins and extensions
sonarqube_logs       - Application logs
```

**Why named volumes?**

- Easy to backup and restore
- Survive container recreation
- Simple to migrate between hosts
- Clear ownership and management

### View Volume Details

```bash
# List all SonarQube volumes
docker volume ls | grep sonarqube

# Inspect specific volume
docker volume inspect sonarqube_data

# Show disk usage
docker system df -v | grep sonarqube
```

## Upgrading SonarQube

### Standard Upgrade Process

**1. Backup First (ALWAYS)**

```bash
# Create timestamped backup
docker run --rm \
  -v sonarqube_data:/data \
  -v ~/sonarqube-backups:/backup \
  alpine tar czf /backup/sonarqube-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

**2. Pull Latest Image**

```bash
docker pull sonarqube:community
```

**3. Stop and Remove Old Container**

```bash
docker stop sonarqube
docker rm sonarqube
```

**4. Start New Container**

```bash
docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  --restart unless-stopped \
  sonarqube:community
```

**5. Verify Startup**

```bash
# Watch logs
docker logs -f sonarqube

# Wait for "SonarQube is operational"
# Then visit http://localhost:9000
```

### Upgrade Script (Automated)

Create `scripts/upgrade-sonarqube.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Checking current SonarQube status..."
docker ps -a | grep sonarqube || echo "Container not found"

echo ""
echo "📦 Creating backup..."
BACKUP_DIR=~/sonarqube-backups
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/sonarqube-$(date +%Y%m%d-%H%M%S).tar.gz"

docker run --rm \
  -v sonarqube_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/$(basename "$BACKUP_FILE") -C /data .

echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "⬇️  Pulling latest SonarQube image..."
docker pull sonarqube:community
echo ""

echo "🛑 Stopping and removing old container..."
docker stop sonarqube 2>/dev/null || true
docker rm sonarqube 2>/dev/null || true
echo ""

echo "🚀 Starting new SonarQube container..."
docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  --restart unless-stopped \
  sonarqube:community

echo ""
echo "⏳ Waiting for SonarQube to start (this takes ~30-60 seconds)..."
sleep 10

for i in {1..12}; do
  if docker logs sonarqube 2>&1 | grep -q "SonarQube is operational"; then
    echo ""
    echo "✅ SonarQube is ready!"
    echo "🌐 Visit: http://localhost:9000"
    exit 0
  fi
  echo "   Still starting... ($i/12)"
  sleep 5
done

echo ""
echo "⚠️  Startup taking longer than expected. Check logs:"
echo "   docker logs -f sonarqube"
```

Make executable:

```bash
chmod +x scripts/upgrade-sonarqube.sh
```

## Backup & Restore

### Manual Backup

**Full Backup (Recommended)**

```bash
# Backup to ~/sonarqube-backups with timestamp
BACKUP_DIR=~/sonarqube-backups
mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v sonarqube_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/sonarqube-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

**Check Backup Size**

```bash
ls -lh ~/sonarqube-backups/
```

Typical size: 200-500MB depending on project history.

### Restore from Backup

**⚠️ WARNING: This overwrites all current SonarQube data!**

```bash
# 1. Stop SonarQube
docker stop sonarqube

# 2. Clear existing data
docker volume rm sonarqube_data

# 3. Recreate volume
docker volume create sonarqube_data

# 4. Restore from backup
docker run --rm \
  -v sonarqube_data:/data \
  -v ~/sonarqube-backups:/backup \
  alpine tar xzf /backup/sonarqube-YYYYMMDD-HHMMSS.tar.gz -C /data

# 5. Start SonarQube
docker start sonarqube
```

### Automated Backup Script

Create `scripts/backup-sonarqube.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR=~/sonarqube-backups
BACKUP_FILE="$BACKUP_DIR/sonarqube-$(date +%Y%m%d-%H%M%S).tar.gz"
KEEP_DAYS=30

echo "📦 Creating SonarQube backup..."
mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v sonarqube_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/$(basename "$BACKUP_FILE") -C /data .

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Clean old backups
echo "🧹 Removing backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "sonarqube-*.tar.gz" -mtime +$KEEP_DAYS -delete
echo "✅ Cleanup complete"
```

Make executable and add to cron if desired:

```bash
chmod +x scripts/backup-sonarqube.sh

# Optional: Run weekly (add to crontab)
# 0 2 * * 0 /path/to/viewer-for-reddit/scripts/backup-sonarqube.sh
```

## Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker logs sonarqube
```

**Common issues:**

1. **Port 9000 already in use**

   ```bash
   # Find what's using port 9000
   lsof -i :9000

   # Or use different port
   docker run -p 9001:9000 ...
   ```

2. **Insufficient memory**

   ```bash
   # SonarQube needs at least 2GB RAM
   docker stats sonarqube
   ```

3. **Corrupted data**
   ```bash
   # Restore from backup (see Restore section)
   ```

### Analysis Fails

**Check SonarQube is running:**

```bash
curl http://localhost:9000/api/system/status
```

Should return: `{"status":"UP"}`

**Verify project configuration:**

Check `sonar-project.properties` in project root:

```properties
sonar.projectKey=viewer-for-reddit
sonar.projectName=Reddit Viewer
sonar.sources=.
sonar.host.url=http://localhost:9000
sonar.token=YOUR_TOKEN_HERE
```

**Regenerate token:**

1. Visit http://localhost:9000
2. Login (admin/admin by default)
3. My Account → Security → Generate Token
4. Update `sonar-project.properties`

### Performance Issues

**Increase container memory:**

```bash
docker stop sonarqube
docker rm sonarqube

docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -m 4g \
  --memory-swap 4g \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  --restart unless-stopped \
  sonarqube:community
```

**Monitor resource usage:**

```bash
docker stats sonarqube
```

### "SonarQube is not operational yet"

**Solution**: Wait 30-60 seconds after starting. SonarQube needs time to:

1. Start Elasticsearch
2. Initialize database
3. Load web server

**Track progress:**

```bash
docker logs -f sonarqube | grep -i "operational"
```

## Configuration

### Project Configuration

File: `sonar-project.properties` (project root)

```properties
# Project identification
sonar.projectKey=viewer-for-reddit
sonar.projectName=Reddit Viewer
sonar.projectVersion=1.0

# Source code location
sonar.sources=.
sonar.exclusions=node_modules/**,coverage/**,dist/**,.next/**

# Coverage reports
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# SonarQube server
sonar.host.url=http://localhost:9000
sonar.token=YOUR_TOKEN_HERE
```

### Quality Gates

Current standards (defined in SonarQube UI):

- **Coverage**: 80% minimum
- **Duplications**: < 3%
- **Maintainability Rating**: A
- **Reliability Rating**: A
- **Security Rating**: A
- **Security Hotspots**: 100% reviewed

### Excluded Files

Add to `sonar.exclusions` in `sonar-project.properties`:

```properties
sonar.exclusions=\
  node_modules/**,\
  coverage/**,\
  dist/**,\
  .next/**,\
  **/*.test.ts,\
  **/*.test.tsx,\
  **/test-utils/**,\
  **/*.config.*
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/sonarqube.yml
name: SonarQube Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24.13'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage

      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

**Note**: For local development, we use Docker. For CI/CD, consider SonarCloud or self-hosted SonarQube server.

## Best Practices

### Development Workflow

1. **Before committing:**

   ```bash
   npm run validate  # Format, typecheck, lint, test
   ```

2. **Before pushing:**

   ```bash
   npm run sonar     # Run SonarQube analysis
   ```

3. **Check results:**
   - Visit http://localhost:9000
   - Review new issues
   - Fix critical issues before merging

### Regular Maintenance

**Weekly:**

- Review new code smells and bugs
- Update quality gates if needed

**Monthly:**

- Check for SonarQube updates
- Review and adjust exclusions
- Backup SonarQube data

**Quarterly:**

- Review historical trends
- Adjust quality gates based on team capacity
- Consider upgrading to LTS version

### Security

**Default Credentials:**

- **Username**: `admin`
- **Password**: `admin`

**⚠️ IMPORTANT**: Change default password immediately after first login!

**Steps:**

1. Login at http://localhost:9000
2. My Account → Security
3. Change password
4. Generate token for CLI use

**Token Storage:**

- Store token in `sonar-project.properties` (gitignored)
- Or use environment variable: `SONAR_TOKEN`
- Never commit tokens to version control

## Useful Commands

```bash
# Container management
docker ps -a | grep sonarqube              # Check status
docker start sonarqube                     # Start
docker stop sonarqube                      # Stop
docker restart sonarqube                   # Restart
docker logs -f sonarqube                   # View logs
docker stats sonarqube                     # Monitor resources

# Volume management
docker volume ls | grep sonarqube          # List volumes
docker volume inspect sonarqube_data       # Inspect volume
docker system df -v | grep sonarqube       # Check disk usage

# Analysis
npm run sonar                              # Run analysis
curl http://localhost:9000/api/system/status  # Check API

# Cleanup
docker stop sonarqube                      # Stop first
docker rm sonarqube                        # Remove container
docker volume prune                        # Remove unused volumes (careful!)
```

## Additional Resources

- [SonarQube Documentation](https://docs.sonarsource.com/sonarqube/latest/)
- [SonarQube Community Forum](https://community.sonarsource.com/)
- [Docker Hub - SonarQube](https://hub.docker.com/_/sonarqube)
- Project Quality Gates: http://localhost:9000/quality_gates

## Support

For project-specific SonarQube issues:

1. Check this documentation
2. Review SonarQube logs: `docker logs sonarqube`
3. Check project issues on GitHub
4. Consult [CONTRIBUTING.md](../CONTRIBUTING.md) for general setup

For SonarQube product issues:

- [SonarQube Community Forum](https://community.sonarsource.com/)
- [SonarQube Issue Tracker](https://github.com/SonarSource/sonarqube/issues)
