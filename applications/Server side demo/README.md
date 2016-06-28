## XAPI Launch Server Demo

The server implements the XAPI Launch algorithm on the server side. This allows a content server to host interactive content and deliver it to the user, with out ever exposing the XAPI session information. 

The server reads the URL that the visiting user sends, extracts the xAPI Launch information (the token and the endpoint), and contacts the Launch Service to initialize the session. The mechanism the server uses to interact with the user is not specified. This example uses plain old server forms, and a cookie to track the session. 

To start this server, run 

>node server.js

The server will run on port 3030. The URL of the experience (where to send the user) is 

http://localhost:3030/question/1