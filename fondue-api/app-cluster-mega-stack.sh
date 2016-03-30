#!/usr/bin/env bash

/bin/bash -c "ulimit -s 65500; exec /Users/josh/.nvm/v0.10.32/bin/node --stack-size=65500 app-cluster.js"