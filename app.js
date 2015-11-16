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

var path = require('path');

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

var bodyParser = require('body-parser');
app.use( bodyParser.json() );
// app.use("/styles",  express.static(__dirname + '/css'));
// app.use("/scripts", express.static(__dirname + '/js'));
// app.use("/images",  express.static(__dirname + '/img'));

//app.configure(function() {
    
   // app.use(express.bodyParser());
    //app.use(express.logger("short"));
//});

app.post('/testId', function(req, res){
  //console.log("hi1");
  calendar_id = req.param('calendar_id');
  googleConfig.calendarId = calendar_id;
  //console.log(googleConfig);
  res.redirect('/');
});


app.post('/postCal', function(req, res){
  var rawData = req.body;
  console.log(req.body);
  // Create the return data object
  var timeObject = {};
  timeObject.when = rawData.when;
  timeObject.duration = rawData.duration;
  timeObject.date = rawData.dates;
  timeObject.mustAttend = [];
  timeObject.mustAttendNum = rawData.mustAttend.length;
  timeObject.curMustAttendNum = 0;
  timeObject.mayAttend = [];
  timeObject.mayAttendNum = rawData.mayAttend.length;
  timeObject.curMayAttendNum = 0;
  timeObject.cusAttend = [];

  for(var i = 0; i < rawData.customGroup.length; i++) {
    var cusObject = {};

    cusObject.mustNumber = rawData.customGroup[i].mustNumber;
    cusObject.groupName = rawData.customGroup[i].groupName;
    cusObject.list = [];
    cusObject.cusAttendNum = rawData.customGroup[i].list.length;
    cusObject.curCusAttendNum = 0;
    timeObject.cusAttend.push(cusObject);    

  }

  
  // type -2 = must, -1 = may, >0 = cus
  function callback(err, events, type) {
    if(err){
      console.log('Error fetching events');
      console.log(err);
    } else {
      if(type == -1) {
        timeObject.mustAttend.push(timeEventFormatter(events));
      } else if(type == -2) {
        timeObject.mayAttend.push(timeEventFormatter(events));
      } else { 
        timeObject.cusAttend[type].list.push(timeEventFormatter(events));
      }      
    }

    if(type == -2) timeObject.curMustAttendNum ++;
    else if(type == -1) timeObject.curMayAttendNum ++;
    else timeObject.cusAttend[type].curCusAttendNum ++;

    // Check if call back is done
    var done = true;
    done = timeObject.curMustAttendNum == timeObject.mustAttendNum && 
      timeObject.curMayAttendNum == timeObject.mayAttendNum;

    for(var i = 0; i < timeObject.cusAttend.length; i++) {
      if(timeObject.cusAttend[i].cusAttendNum != 
        timeObject.cusAttend[i].curCusAttendNum)
        done = false;
    }

    if(!done) return;
    
    alg(timeObject, res);
  }

  for(var i = 0; i < rawData.mustAttend.length; i++) {
    getCalData(rawData.mustAttend[i], callback, -2);
  }

  for(var i = 0; i < rawData.mayAttend.length; i++) {
    getCalData(rawData.mayAttend[i], callback, -1);
  }

  for(var i = 0; i < rawData.customGroup.length; i++) {
    for(var ii = 0; ii < rawData.customGroup[i].list.length; ii++){
      getCalData(rawData.customGroup[i].list[ii], callback, i);
    }
  }
});

function alg(timeObject, res){
  timeObjectFormatter(timeObject);

  // Logic in Here






  res.send(timeObject);
}

function timeEventFormatter(timeEvent) {
  var perttyTimeEvent = {};
  perttyTimeEvent.summary = timeEvent.summary;
  perttyTimeEvent.owner = timeEvent.items.length > 0 ? 
    timeEvent.items[0].creator.displayName : timeEvent.summary;
  perttyTimeEvent.timeZone = timeEvent.timeZone;
  perttyTimeEvent.items = [];
  for(var i = 0; i < timeEvent.items.length; i++) {
    var rawItem = timeEvent.items[i];
    var itemInfo = {};
    itemInfo.summary = rawItem.summary == undefined ? "" : rawItem.summary;
    itemInfo.startTime = rawItem.start.dateTime == undefined ? rawItem.start.date : rawItem.start.dateTime;
    itemInfo.endTime = rawItem.end.dateTime == undefined ? rawItem.end.date : rawItem.end.dateTime;
    perttyTimeEvent.items.push(itemInfo);
  }

  return perttyTimeEvent;
}

function timeObjectFormatter(timeObject) {
  // Delete temp variables
  delete timeObject.mustAttendNum;
  delete timeObject.curMustAttendNum;
  delete timeObject.mayAttendNum;
  delete timeObject.curMayAttendNum;
  for(var i = 0; i < timeObject.cusAttend.length; i++) {
    delete timeObject.cusAttend[i].cusAttendNum;
    delete timeObject.cusAttend[i].curCusAttendNum;
  }
}

function getCalData(calId, callback, type){
  // Format today's date
  googleConfig.calendarId = calId;
  var today = moment().format('YYYY-MM-DD') + 'T';

  // Call google to fetch events for today on our calendar
  calendar.events.list({
    calendarId: googleConfig.calendarId,
    maxResults: 20,
    timeMin: today + '00:00:00.000Z',
    timeMax: today + '23:59:59.000Z',
    auth: oAuthClient
  }, function(err, events) {
    callback(err, events, type);
  });
}

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
 // res.sendFile(path.join(__dirname, '/Frontend/index.html'));
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
         // res.redirect('/testId');
          //console.log(__dirname);
          console.log(path.join(__dirname, '/index.html'));

          app.use(express.static(path.join(__dirname, 'Frontend')));
          res.sendFile(path.join(__dirname, '/Frontend/index.html'));
          //res.render('index',{});
        }
      });
    } 
});

var server = app.listen(8080, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});