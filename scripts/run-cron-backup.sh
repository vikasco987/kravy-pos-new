#!/bin/bash

# Navigate to the project directory
cd /Users/vikas/Desktop/kravy-pos-website

# Load environment variables (optional if your script handles it)
# export $(grep -v '^#' .env | xargs)

# Run the backup command
# We use npm run db:backup which we added to package.json
/usr/local/bin/npm run db:backup >> /Users/vikas/Desktop/kravy-pos-website/scripts/backup.log 2>&1
