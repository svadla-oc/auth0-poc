# pm
This application was generated using JHipster 4.1.0, you can find documentation and help at [https://jhipster.github.io/documentation-archive/v4.1.0](https://jhipster.github.io/documentation-archive/v4.1.0).

This is a "gateway" application intended to be part of a microservice architecture, please refer to the [Doing microservices with JHipster][] page of the documentation for more information.

This application is configured for Service Discovery and Configuration with . On launch, it will refuse to start if it is not able to connect to .

## Run
    yarn install
    yarn start

## SSO Setup

### app1.com
1. Take a note port number of BrowserSyncPlugin port and proxy target port in [webpack/webpack.dev.js](webpack/webpack.dev.js).
2. Edit APP_DOMAIN, APP_PORT (same as BrowserSyncPlugin port number), AUTH0_CLIENT_ID, and AUTH0_DOMAIN in [src/main/webapp/app/app.constants.ts](src/main/webapp/app/app.constants.ts).
3. Run the application.
4. Access with http://app1.com:9000/.

### app2.com
1. Copy protocol-manager to protocol-manager2
2. Change directory to protocol-manager2
3. Change port number of BrowserSyncPlugin port (e.g 9001) and proxy target port (e.g 9061) in [webpack/webpack.dev.js](webpack/webpack.dev.js).
4. Change port number of webpack:dev script (same as BrowserSyncPlucgin proxy target port, e.g 9061) in [package.json](package.json).
5. Port number in number 3 and 4 should be different from port number used in app1.com.
Edit APP_DOMAIN, APP_PORT (same as BrowserSyncPlugin port number), AUTH0_CLIENT_ID, and AUTH0_DOMAIN in [src/main/webapp/app/app.constants.ts](src/main/webapp/app/app.constants.ts).
6. Run the application.
7. Access with http://app2.com:9001/

## Package production war
To package production war, run: ./mvnw -DskipTests -Pprod package
Note: Skipping tests as some of the poc changes break the existing unit tests
