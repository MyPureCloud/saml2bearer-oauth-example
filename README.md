# SAML2BEARER OAuth Example

This example application demonstrates logging in to PureCloud _without the PureCloud login UI_ via SAML. This is accomplished with the following components:

* A local node.js server to serve web pages and accept the SAML assertion
* An Okta app to authenticate the user and provide a SAML assertion (this can be done with any supported SAML IdP, the example uses Okta)
* Use of the /oauth/token endpoint to exchange a SAML assertion for a PureCloud auth token

# Prerequisites

* [node.js](https://nodejs.org)
* An [Okta](https://www.okta.com/) subscription or a 100% free [Okta developer account](https://www.okta.com/developer/signup/)
* A [PureCloud](https://mypurecloud.com) organization

# Setup

## Okta App

You will need an Okta SAML app configured to send the assertion to your server. For more information on setting up an Okta app, see the wiki page [Okta App Configuration]().

## PureCloud

You will need an OAuth client of type `SAML2BEARER`. For more information, see the wiki page [Creating a SAML2BEARER OAuth Client]().

## Node Server Config File

The config file is located in the root of the project and is named `config.json`. This file is written with default values for your convience if the file does not exist when the server is started. Edit this file to provide appropriate settings for your Okta and PureCloud configurations.

* **security**: SSL files. See [https.createServer(...)](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) for more info
  * **privateKeyPath**: The path to the PEM private key file, not required if HTTPS is disabled (default: ./certs/server-key.pem)
  * **certificatePath**: The path to the PEM certificate file, not required if HTTPS is disabled (default: ./certs/server-crt.pem)
* **pureCloud**
  * **environment**: The PureCloud environment to connect to (default: mypurecloud.com)
  * **orgName**: Your PureCloud org short name, found [here](https://apps.mypurecloud.com/directory/#/admin/general-info/details)
  * **clientId**: The SAML2BEARER OAuth client ID
  * **clientSecret**: The SAML2BEARER OAuth client secret
* **disableHttp**: `true` to disable the HTTP server (default: `false`)
* **httpPort**: The port on which to run the HTTP server (default: 8000)
* **disableHttps**: `true` to disable the HTTPS server (default: `false`)
* **httpsPort**: The port on which to run the HTTPS server (default: 8443)

## Node Server

1. Clone this repo locally
2. Run `npm install`
3. Run `node server.js` - If no config file exists, it will write one for you.
4. Stop the server and edit `config.json` with appropriate values
5. If using HTTPS, generate certificates for node's HTTPS server. Here's a [step-by-step guide](https://engineering.circle.com/https-authorized-certs-with-node-js-315e548354a2) to generate the certs.
6. Run `node server.js`
