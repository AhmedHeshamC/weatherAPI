const Memcached = require('memcached');

const memcachedServer = process.env.MEMCACHED_SERVER || '127.0.0.1:11211';
const memcached = new Memcached(memcachedServer);

console.log(`Attempting to connect to Memcached at ${memcachedServer}`);

// Optional: Listen for connection issues (though the client often handles reconnections)
memcached.on('failure', (details) => {
    console.error( `Memcached server ${details.server} went down: ${details.messages.join( '' )}` );
});

memcached.on('reconnecting', (details) => {
    console.log( `Total downtime for server ${details.server}: ${details.totalDownTime}ms` );
});

// Test connection (optional, but good for diagnostics)
memcached.connect( memcachedServer, ( err, conn ) => {
    if( err ) {
       console.error( `Error connecting to Memcached: ${err}` );
    } else {
        console.log( `Successfully connected to Memcached server: ${conn.server}` );
        // You might want to disconnect if just testing, or keep the connection pool alive
        // For the application, you don't typically disconnect here.
        // conn.close(); // Don't close in the actual app setup
    }
 });


module.exports = memcached;
