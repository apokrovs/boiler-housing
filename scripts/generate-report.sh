#!/bin/bash
# Git Commit Report Generator
#
# This script generates a markdown table report of all commits across
# all branches in a git repository with the following columns:
# - Date
# - Hours (time since previous commit by the same user)
# - Commit ID
# - Task (Commit message)
# - Name (Author)
# - Comments (left blank)
#
# Usage: ./git_commit_report.sh [output_file] [start_date]
# Example: ./git_commit_report.sh report.md "2023-01-01"

set -e

# Default output file
OUTPUT_FILE=${1:-"commit_report.md"}
# Default start date (empty means all commits)
START_DATE=${2:-""}

# Check if current directory is a git repository
if [ ! -d .git ]; then
  echo "Error: Current directory is not a git repository."
  echo "Please run this script inside a git repository."
  exit 1
fi

echo "Fetching latest changes from remote repositories..."
git fetch --all

# Get repository sender_name from remote
REPO_NAME=$(git remote -v | grep fetch | head -n 1 | awk '{print $2}')
echo "Repository: $REPO_NAME"

# Create output file with header
echo "# Git Commit Report" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Repository: $REPO_NAME" >> "$OUTPUT_FILE"
if [ -n "$START_DATE" ]; then
  echo "Start Date: $START_DATE" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"
echo "| Date | Hours | Commit ID | Task | Name | Comments |" >> "$OUTPUT_FILE"
echo "|------|-------|-----------|------|------|----------|" >> "$OUTPUT_FILE"

# Create a temporary file for all commit data
TEMP_FILE=$(mktemp)

# Get all branches (local and remote)
echo "Getting all branches..."
LOCAL_BRANCHES=$(git branch | sed 's/^[* ] //')
REMOTE_BRANCHES=$(git branch -r | grep -v HEAD | sed 's/^  //')
ALL_BRANCHES="$LOCAL_BRANCHES
$REMOTE_BRANCHES"

# Count unique branch names
UNIQUE_BRANCHES=$(echo "$ALL_BRANCHES" | sort -u)
BRANCH_COUNT=$(echo "$UNIQUE_BRANCHES" | grep -v '^$' | wc -l)
echo "Found $BRANCH_COUNT unique branches"

# Process each branch
echo "$UNIQUE_BRANCHES" | while read -r BRANCH; do
  # Skip empty lines
  [ -z "$BRANCH" ] && continue
  
  echo "Processing branch: $BRANCH"
  
  # Get all commits in this branch with date format
  GIT_DATE_FORMAT="%Y-%m-%d %H:%M:%S"
  
  # Add date filter if start date is specified
  DATE_FILTER=""
  if [ -n "$START_DATE" ]; then
    DATE_FILTER="--since=$START_DATE"
  fi
  
  # Get all commits with required information
  # Use 2>/dev/null to suppress errors for non-existent branches
  git log "$BRANCH" $DATE_FILTER --pretty=format:"%H|%an|%ad|%s" --date=format:"$GIT_DATE_FORMAT" 2>/dev/null >> "$TEMP_FILE" || {
    echo "Warning: Could not get logs for branch $BRANCH, skipping..."
    continue
  }
  
  # Add newline between branches
  echo "" >> "$TEMP_FILE"
done

# Sort all commits by date
SORTED_COMMITS=$(sort -r "$TEMP_FILE" | grep -v "^$")

# Dictionary to keep track of the last commit time for each author
declare -A LAST_COMMIT_TIME

# Process each commit and write to the output file
while IFS= read -r COMMIT_LINE; do
  # Skip empty lines
  [ -z "$COMMIT_LINE" ] && continue
  
  # Parse commit data
  COMMIT_SHA=$(echo "$COMMIT_LINE" | cut -d'|' -f1)
  AUTHOR=$(echo "$COMMIT_LINE" | cut -d'|' -f2)
  COMMIT_DATE=$(echo "$COMMIT_LINE" | cut -d'|' -f3)
  MESSAGE=$(echo "$COMMIT_LINE" | cut -d'|' -f4)
  
  # Short commit ID (first 7 characters)
  SHORT_SHA=${COMMIT_SHA:0:7}
  
  # Calculate hours since last commit by the same author
  HOURS=""
  if [ -n "${LAST_COMMIT_TIME[$AUTHOR]}" ]; then
    # Convert dates to Unix timestamps
    PREV_TIMESTAMP=$(date -d "${LAST_COMMIT_TIME[$AUTHOR]}" +%s)
    CURR_TIMESTAMP=$(date -d "$COMMIT_DATE" +%s)
    
    # Calculate time difference in seconds
    TIME_DIFF=$((PREV_TIMESTAMP - CURR_TIMESTAMP))
    
    # Only use positive differences (earlier commit is subtracted from later commit)
    if [ $TIME_DIFF -gt 0 ]; then
      # Convert to hours with 2 decimal places
      HOURS=$(echo "scale=2; $TIME_DIFF / 3600" | bc)
    fi
  fi
  
  # Update last commit time for this author
  LAST_COMMIT_TIME[$AUTHOR]="$COMMIT_DATE"
  
  # Escape pipe characters in commit message
  MESSAGE=$(echo "$MESSAGE" | sed 's/|/\\|/g')
  
  # Truncate message if too long
  if [ ${#MESSAGE} -gt 100 ]; then
    MESSAGE="${MESSAGE:0:97}..."
  fi
  
  # Write row to output file
  echo "| $COMMIT_DATE | $HOURS | $SHORT_SHA | $MESSAGE | $AUTHOR | |" >> "$OUTPUT_FILE"
done <<< "$SORTED_COMMITS"

# Remove duplicate lines (same commit might appear in multiple branches)
TEMP_DEDUPE=$(mktemp)
sort -u "$OUTPUT_FILE" > "$TEMP_DEDUPE"
mv "$TEMP_DEDUPE" "$OUTPUT_FILE"

# Clean up
rm "$TEMP_FILE"

echo "Report generated successfully: $OUTPUT_FILE"
echo "Script completed."
