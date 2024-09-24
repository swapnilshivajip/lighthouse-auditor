#!/bin/bash

# Function to run the command
run_command() {
    node ./src/index.js
}

# Parse command-line arguments
PARALLEL_COUNT=0
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --parallel=*) PARALLEL_COUNT="${1#*=}";;
        *) echo "Unknown parameter passed: $1"; exit 1;;
    esac
    shift
done

# Check if the parallel count is set and is a positive integer
if [ "$PARALLEL_COUNT" -le 0 ] 2>/dev/null; then
    echo "Error: Parallel count must be a positive integer."
    exit 1
fi

# Run the command in parallel
for i in $(seq 1 $PARALLEL_COUNT); do
    run_command &
done

# Wait for all background jobs to complete
wait

echo "All parallel processes have completed."
