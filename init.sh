#!/bin/bash

export NODE_NO_WARNINGS=1

function supervise() {
  while true; do $@ && break; done
}

trap "pkill -P $$" SIGINT SIGTERM EXIT

# Index everything once

npm run index:mainnet & pids+=($!)
npm run index:optimism & pids+=($!)
npm run index:fantom & pids+=($!)
npm run index:goerli & pids+=($!)
npm run passport & pids+=($!)

for pid in ${pids[*]}; do
  echo "=> Waiting for $pid"

  if wait $pid; then
    echo "=> Process $pid success"
  else
    echo "=> Process $pid failure"
    exit 1
  fi
done

# Run HTTP server and run everything as a long running process
if [ "$1" == "server" ]; then

  echo "=> Index successful, running server!"

  # supervise "npm run passport -- --follow" &
  # supervise "npm run index:goerli -- --follow" &
  supervise "npm run index:mainnet -- --follow" &
  # supervise "npm run index:optimism -- --follow" &
  # supervise "npm run index:fantom -- --follow" &

  supervise "npm run serve" &

  wait

fi
