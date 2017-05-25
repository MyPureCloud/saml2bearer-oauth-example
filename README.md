# SAML2 Bearer OAuth Example

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

You will need an Okta SAML app configured to send the assertion to your server. Follow the standard instuctions for [configuring Okta as a SSO provider](https://help.mypurecloud.com/articles/add-okta-as-a-single-sign-on-provider/) with the following exceptions:

* _Single sign on URL_ and _Audience URI_ should be the URL to your app where the SAML assertion POST will be received. In the case of this example application, `https://localhost:8443/saml` may be a good value.

## PureCloud

You will need an OAuth client of type `SAML2 BEARER`. 

### Create OAuth client via UI

The SAML2 Bearer OAuth client can be created through the UI here: https://apps.mypurecloud.com/directory/#/admin/integrations/oauth

### Create OAuth client via API

Make a request to [POST /api/v2/oauth/clients](https://developer.mypurecloud.com/api/rest/v2/oauth/index.html#postOauthClients) with the property `"authorizedGrantType":"SAML2BEARER"`. The rest of the properties should be set according to your configuration. Here is an example request body:

```
POST /api/v2/oauth/clients HTTP/1.1
Host: api.mypurecloud.com
Authorization: bearer mytoken
Content-Type: application/json

{
   "name": "SAML2 Bearer Client",
   "accessTokenValiditySeconds": 86400,
   "description": "A SAML client",
   "registeredRedirectUri": [
      "https://localhost:8443" 
    ],
   "authorizedGrantType": "SAML2BEARER"
}
```

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
