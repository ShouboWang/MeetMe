//Lets require/import the HTTP module
// var http = require('http');
// var fs = require('fs');
// const PORT=8000; 

// fs.readFile('./index.html', function (err, html) {
//     if (err) {
//         throw err; 
//     }       
//     http.createServer(function(request, response) {  
//         response.writeHeader(200, {"Content-Type": "text/html"});  
//         response.write(html);  
//         response.end();  
//     }).listen(PORT);
// });


// //Lets define a port we want to listen to


// //We need a function which handles requests and send response
// function handleRequest(request, response){
//     response.end('It Works!! Path Hit: ' + request.url);
// }

// //Create a server
// var server = http.createServer(handleRequest);

// //Lets start our server
// server.listen(PORT, function(){
//     //Callback triggered when server is successfully listening. Hurray!
//     console.log("Server listening on: http://localhost:%s", PORT);
// });


var calendar_id;
// Google OAuth Configuration
var googleConfig = {
  clientID: '330889396228-qm5hvhcfkl12fnbuten4e16qgu7fb7g5.apps.googleusercontent.com',
  clientSecret: 'cw6eP8ibIOrnNr52Bt1-KSzN',
  //calendarId: '46fubf2umlcus68fl0i6g4rmfk@group.calendar.google.com',  //make var
  //calendarId: 'en.canadian#holiday@group.v.calendar.google.com',
  calendarId: calendar_id,
  redirectURL: 'http://localhost:8080/auth' //modify later
};

// Dependency setup
var express = require('express'),
  moment = require('moment'),
  google = require('googleapis');

// Initialization
var app = express(),
  calendar = google.calendar('v3');
  oAuthClient = new google.auth.OAuth2(googleConfig.clientID, googleConfig.clientSecret, googleConfig.redirectURL),
  authed = false;

app.post('/testId', function(req, res){
  calendar_id = req.param('calendar_id');
  googleConfig.calendarId = calendar_id;
  console.log(googleConfig);
  res.redirect('/');
});


// Response for localhost:2002/
app.get('/', function(req, res) {
//app.get('/userEvents/:username', function(req, res) {
  // If we're not authenticated, fire off the OAuth flow
  if (!authed) {

    // Generate an OAuth URL and redirect there
    var url = oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar.readonly'
    });
    res.redirect(url);
  } else {

      // Format today's date
      var today = moment().format('YYYY-MM-DD') + 'T';

      // Call google to fetch events for today on our calendar
      calendar.events.list({
        calendarId: googleConfig.calendarId,
        maxResults: 20,
        timeMin: today + '00:00:00.000Z',
        timeMax: today + '23:59:59.000Z',
        auth: oAuthClient
      }, function(err, events) {
        if(err) {
          console.log('Error fetching events');
          console.log(err);
        } else {

          // Send our JSON response back to the browser
          console.log('Successfully fetched events');
          res.send(events);
        }
      });
  }
});

// Return point for oAuth flow, should match googleConfig.redirectURL
app.get('/auth', function(req, res) {

    var code = req.param('code');

    if(code) {
      // Get an access token based on our OAuth code
      oAuthClient.getToken(code, function(err, tokens) {

        if (err) {
          console.log('Error authenticating')
          console.log(err);
        } else {
          console.log('Successfully authenticated');
          console.log(tokens);
          
          // Store our credentials and redirect back to our main page
          oAuthClient.setCredentials(tokens);
          authed = true;
          res.redirect('/testId');
        }
      });
    } 
});

var server = app.listen(8080, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});