#!/bin/bash

set -e

# Exit script on interrupts
trap "exit 130" INT

echo "======> Clearing cache"
find /mnt/indexer/cache -type f | xargs rm


echo "======> Catching up"

# Catch up indexers to latest block first,
# do not run the HTTP server, as we don't want to serve traffic
# because data won't be up to date yet
npx concurrently \
  --kill-others-on-fail \
  --names "mainnet,optimism,goerli,fantom,passport" \
  'npm:index -- --chain=mainnet --log-level=error --clear' \
  'npm:index -- --chain=optimism --log-level=error --clear' \
  'npm:index -- --chain=goerli --log-level=error --clear' \
  'npm:index -- --chain=fantom --log-level=error --clear' \
  'npm:passport'

echo "======> Catch up successful, running indexer on follow mode!"

# Once caught up, start indexers in follow mode and run HTTP server,
# we can now start serving traffic
exec npx concurrently \
  --restart-tries=10 \
  --names "mainnet,optimism,goerli,fantom,passport,http" \
  'npm:index -- --chain=mainnet --follow' \
  'npm:index -- --chain=optimism --follow' \
  'npm:index -- --chain=goerli --follow' \
  'npm:index -- --chain=fantom --follow' \
  'npm:passport -- --follow' \
  'npm:serve'
