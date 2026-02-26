#!/bin/bash
# ------------------------------------------------
# Tracciona — SonarQube local scan
# Uso: bash sonar/run-scan.sh
# ------------------------------------------------

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SONAR_URL="http://localhost:9000"
SONAR_TOKEN="${SONAR_TOKEN:-}"

# Check SonarQube is running
echo ">> Checking SonarQube at $SONAR_URL ..."
MAX_WAIT=60
WAITED=0
until curl -s "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "ERROR: SonarQube not ready after ${MAX_WAIT}s. Is Docker running?"
    echo "Start it with: docker compose -f sonar/docker-compose.yml up -d"
    exit 1
  fi
  echo "   Waiting for SonarQube to be ready... (${WAITED}s)"
  sleep 5
  WAITED=$((WAITED + 5))
done
echo ">> SonarQube is UP"

# Build token flag
TOKEN_FLAG=""
if [ -n "$SONAR_TOKEN" ]; then
  TOKEN_FLAG="-Dsonar.token=$SONAR_TOKEN"
fi

# Run scanner via Docker (no install needed)
echo ">> Running SonarScanner..."
docker run --rm \
  --network="host" \
  -v "$PROJECT_DIR:/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli:latest \
  -Dsonar.host.url="$SONAR_URL" \
  $TOKEN_FLAG

echo ""
echo ">> Done! Open http://localhost:9000/dashboard?id=tracciona"
