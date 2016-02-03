# Ibex

A platform for extracting UI behaviors into learning examples.

#To install:
    #install nvm or node
    #use nodeJS version 0.10.32
    #install redis 3

    cd fondue-api
    npm install
    
    cd jsbin-mod
    npm install


#To run:

    Install chrome-extension from chrome://extensions > Install plugin from disk
    
    cd fondue-api/redis
    ./redisStart.sh  #start redis
    
    cd fondue-api
    node app-cluster.js  #start fondue api on all cores
    
    cd jsbin-mod
    node bin/jsbin
    
#To use:

    Open web page
    
    Open Chrome Dev Tools
    
    Reload Page with Ibex
    
    Instrument Page, wait a few minutes for source tracing, watch fondue-api logs for activity
    
    Wait for page to fully reappear and work
    
    Record
    
    Do UI behavior/actiity
    
    Stop Recording
    
    Fiddle
    
    JS Bin page will open with result
    