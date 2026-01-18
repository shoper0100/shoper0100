#!/bin/bash
# Simple deployment server for Next.js standalone build

cd /opt/ridebnb/webapp

# Install production dependencies only
npm install --production --ignore-scripts

# Start the server
PORT=3000 node server.js
