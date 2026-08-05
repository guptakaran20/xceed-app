#!/bin/bash
# pull-from-ams.sh
# Fast sync from AMS-with-TimeTable client folder to this repository.

AMS_PATH="../IAMS/AMS-with-TimeTable"
THIS_APP_PATH="../../learning-module-app"

echo "Syncing files from AMS-with-TimeTable (Fast Mode)..."

# Use git archive to safely copy only tracked files from the client folder
# This ignores node_modules and other untracked files instantly.
cd "$AMS_PATH" || { echo "Error: Could not find AMS folder"; exit 1; }
git archive HEAD:client | (cd "$THIS_APP_PATH" && tar -x)
cd - > /dev/null || exit

echo "Files synced successfully!"
echo "Committing the updates..."

# Stage all updated files
git add .
# Commit them, only if there are changes
git commit -m "Fast Sync: Pulled latest client updates from AMS-with-TimeTable" || echo "No new changes to commit."

echo "Done! Your code is now updated and committed locally."
echo "You can run 'git push' to push this update to your xceed-app repository on GitHub."
