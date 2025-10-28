#!/usr/bin/env bash

# Skip postinstall script in CI/production environments
# This script only runs in local development

# Check if running in Vercel, Netlify, or other CI environments
if [ -n "$VERCEL" ] || [ -n "$NETLIFY" ] || [ -n "$CI" ]; then
  echo "⏭️  Skipping postinstall script in CI/production environment"
  exit 0
fi

# Check if running in GitHub Actions or GitLab CI
if [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ]; then
  echo "⏭️  Skipping postinstall script in CI environment"
  exit 0
fi

# Run the hardhat deployment script only in local development
echo "🚀 Running local development setup..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/deploy-hardhat-node.sh"
