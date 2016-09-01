var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var request = require('superagent-bluebird-promise');
var express = require('express');
var bodyParser = require('body-parser');
var colors = require('colors');
var mime = require('mime');

// Local config module - edit config.js with your settings!
var config = require('./config');

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
})

// Create Express app
var app = express();

// Use body-parser module
app.use(bodyParser.urlencoded({ extended: false }));

/*
 * Handle all GET requests
 * This function can be ignored in the context of this example application. The 
 * purpose of this function is to serve up files out of the public folder when 
 * requests are recieved. This function is not necessary for the SAML flow, but 
 * is used to facilitate this example as a very simple web server.
 */
app.get('*', function(req, res){
	try {
	    console.log(('GET ' + req.originalUrl).green);
	    
	    // Force path to the public directory
	    var filePath = path.join('./public', req.originalUrl);

		try {
			// Throws exception if file doesn't exist
		    var stats = fs.statSync(filePath);

		    // See if this resolved to a directory
		    if (stats.isDirectory()) {
		    	// Look for index.html as a default file
	    		filePath = path.join(filePath, 'index.html');
	    		try {
	    			// Throws error if index.html doesn't exist
	    			stats = fs.statSync(filePath);
	    		} catch(err) {
			    	console.log('  403 Directory listing denied');
			    	res.status(403).send('403 Directory listing denied');
			    	return;
	    		}
		    }
		} catch(err) {
			console.log('  404 ' + filePath);
			res.status(404).send('404 Not found');
			return;
		}

		// Read in file to send
		console.log('  Serving ' + filePath);
	    var html = fs.readFileSync(filePath);
	    console.log('  200 OK')

	    // Determine Content-Type response header
	    var mimeType = mime.lookup(filePath);
	    console.log('  mimeType: ' + mimeType);
	    res.writeHead(200, {'Content-Type': mimeType});

	    // Send file
	    res.end(html);
	} catch(err) {
		console.log('  500 ' + err.toString());
		res.status(500).send('500 ' + err.toString());
	}
});

// Handle POST requests to /saml
// Okta will post the assertion to this URL as form data
app.post('/saml', function(req, res){
    console.log(('POST ' + req.originalUrl).blue);

    // Okta assertion is located at req.body.SAMLResponse
    var assertion = req.body.SAMLResponse;

    // Prepare client credentials for the token request
    // https://developer.mypurecloud.com/api/rest/authorization/base-64-encoding.html
	var encodedData = new Buffer(config.pureCloud.clientId + ':' + config.pureCloud.clientSecret).toString('base64');

	// Make POST request to get an auth token from the SAML assertion
	request.post('https://login.' + config.pureCloud.environment + '/oauth/token')
		// Set the headers
		.set('Authorization', 'Basic ' + encodedData)
		.set('Content-Type', 'application/x-www-form-urlencoded')
		// Add form data
		.type('form')
    	.send({grant_type:'urn:ietf:params:oauth:grant-type:saml2-bearer'})
    	.send({orgName:config.pureCloud.orgName})
    	.send({assertion:assertion})
    	// Handle response
    	.then(function(postTokenResponse) {
    		// Get access token from response
    		var access_token = postTokenResponse.body.access_token;

    		// Make sure we got a value
    		if (!access_token) {
    			console.log('  [ERROR] Failed to get access_token!'.red);
    			res.status(500).send('500 Unable to obtain access token!')
    			return;
    		}

    		// Create SDK instance and specify the token to use (do not call .login() here, we already have a token)
    		var purecloud = require('purecloud_api_sdk_javascript');
    		var session = purecloud.PureCloudSession({
    			token: access_token
    		});

    		// Call GET /api/v2/users/me to validate the token
    		var api = new purecloud.UsersApi(session);
			api.getMe()
				.then(function(me){
					console.log('Thanks for Authenticating via SAML, ' + me.name + ' (' + me.username + ')');
					
					// Send 302 redirect and include the access token for client-side consumption
					// In a server-side app, the token would be retained by the server
					res.redirect('/#access_token=' + access_token);
				})
				.catch(function(err){
					console.log(err);
		    		res.status(500).send('  500 authorization failed: ' + err);
				});
    	},
    	function(err) {
    		console.log(err);
    		res.status(500).send('  500 authorization failed: ' + err);
    	});
});

var httpServer;
var httpsServer;

// Start HTTP server
if (config.disableHttp != true) {
	httpServer = http.createServer(app);
	httpServer.listen(config.httpPort);
	console.log(('HTTP server running on port ' + httpServer.address().port).cyan);
}

// Start HTTPS server
if (config.disableHttps != true) {
	// Check for certificates and warn if they aren't found
	// gen certs: https://engineering.circle.com/https-authorized-certs-with-node-js-315e548354a2
	var privateKey; 
	var certificate;
	try {
		if (config.disableHttps != true) {
			// This will throw an error if the specified files don't exist
			var stats = fs.statSync(config.security.privateKeyPath);
			stats = fs.statSync(config.security.certificatePath);
			privateKey  = fs.readFileSync(config.security.privateKeyPath, 'UTF-8');
			certificate = fs.readFileSync(config.security.certificatePath, 'UTF-8');
		}
	} catch(err) {
		console.log(err);
		console.log('SSL certificates not loaded! HTTPS server will not work!'.red);
		console.log('Follow the copy/paste instructions on this blog to generate certs https://engineering.circle.com/https-authorized-certs-with-node-js-315e548354a2');
	}

	httpsServer = https.createServer({key: privateKey, cert: certificate}, app);
	httpsServer.listen(config.httpsPort);
	console.log(('HTTPS server running on port ' + httpsServer.address().port).cyan);
}