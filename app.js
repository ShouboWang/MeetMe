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
  timeObject.dates = rawData.dates;
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
    if (timeObject.curMustAttendNum != timeObject.mustAttendNum ||
      timeObject.curMayAttendNum != timeObject.mayAttendNum) return;
    for(var i = 0; i < timeObject.cusAttend.length; i++) {
      if(timeObject.cusAttend[i].cusAttendNum !=
        timeObject.cusAttend[i].curCusAttendNum)
        return;
    }

    alg(timeObject, res);
  }

  for (var d = 0; d < timeObject.dates.length; d++) {
    var date = new Date(timeObject.dates[d]);

    for(var i = 0; i < rawData.mustAttend.length; i++) {
      getCalData(rawData.mustAttend[i], date, callback, -2);
    }

    for(var i = 0; i < rawData.mayAttend.length; i++) {
      getCalData(rawData.mayAttend[i], date, callback, -1);
    }

    for(var i = 0; i < rawData.customGroup.length; i++) {
      for(var ii = 0; ii < rawData.customGroup[i].list.length; ii++){
        getCalData(rawData.customGroup[i].list[ii], date, callback, i);
      }
    }
  }
});

function findFreeTimes(rangeStart, rangeEnd, minDuration, busyList) {
  if (busyList.length == 0) {
    return [{
      "startTime" : new Date(rangeStart).toISOString(),
      "endTime" : new Date(rangeEnd).toISOString()
    }];
  }

  var freeTimes = [];
  var iStart = new Date(rangeStart);
  var iEnd = new Date(rangeEnd);
  for (var i = 0; i < busyList.length; i++) {
    iEnd = new Date(busyList[i].startTime);
    var diffMins = Math.round( (Math.abs(iEnd - iStart) / 1000) / 60 );
    if (diffMins >= minDuration) {
      freeTimes.push({
        "startTime" : iStart.toISOString(),
        "endTime" : iEnd.toISOString()
      });
    }
    iStart = new Date(busyList[i].endTime);
  }

  var diffMins = Math.round( (Math.abs(new Date(rangeEnd) - iStart) / 1000) / 60 );
  if (diffMins >= minDuration) {
    freeTimes.push({
      "startTime" : iStart.toISOString(),
      "endTime" : new Date(rangeEnd).toISOString()
    });
  }
  return freeTimes;
}

function alg(timeObject, res){
  //console.log("Time Object");
  //console.log(timeObject);
  timeObjectFormatter(timeObject);

  var timeOfDay = timeObject.when;
  var todBegin, todEnd;
  if (timeOfDay == 1) { // all day
    todBegin = 7;
    todEnd = 21;
  } else if (timeOfDay == 2) { // morning
    todBegin = 7;
    todEnd = 12;
  } else if (timeOfDay == 3) { // afternoon
    todBegin = 12;
    todEnd = 17;
  } else if (timeOfDay == 4) { // night
    todBegin = 17;
    todEnd = 21;
  }

  var mustItems = [];
  // filter out applicable events into mustItems
  for (var i = 0; i < timeObject.mustAttend.length; i++) {
    var mustAttendeeItems = timeObject.mustAttend[i].items;
    for (var ii = 0; ii < mustAttendeeItems.length; ii++) {
      var startTime = new Date(mustAttendeeItems[ii].startTime);
      var endTime = new Date(mustAttendeeItems[ii].endTime);
      if (startTime.getHours() >= todBegin && endTime.getHours() <= todEnd) {
        mustItems.push({
          'startTime' : startTime,
          'endTime' : endTime
        });
      }
    }
  }

// // dummy data
// mustItems.push({
//   'startTime' : '2015-11-17T09:00:00.000Z',
//   'endTime' :   '2015-11-17T11:00:00.000Z'
// },
// {
//   'startTime' : '2015-11-17T10:30:00.000Z',
//   'endTime' :   '2015-11-17T13:00:00.000Z'
// },
// {
//   'startTime' : '2015-11-17T16:00:00.000Z',
//   'endTime' :   '2015-11-17T17:00:00.000Z'
// },
// {
//   'startTime' : '2015-11-18T07:30:00.000Z',
//   'endTime' :   '2015-11-18T12:00:00.000Z'
// },
// {
//   'startTime' : '2015-11-18T12:45:00.000Z',
//   'endTime' :   '2015-11-18T21:00:00.000Z'
// });

  mustItems.sort(function(a, b) {
    return new Date(b.startTime) - new Date(a.startTime);
  });

  // merge overlapping items
  var i = mustItems.length;
  while (--i > 0) { // iterate reverse
    var currStartTime = new Date(mustItems[i].startTime);
    var prevEndTime = new Date(mustItems[i-1].endTime);
    if (currStartTime.getFullYear() == prevEndTime.getFullYear()
        && currStartTime.getMonth() == prevEndTime.getMonth()
        && currStartTime.getDate() == prevEndTime.getDate()
        && currStartTime.getTime() <= prevEndTime.getTime()) {
      mustItems[i].startTime = mustItems[i-1].startTime;
      mustItems.splice(i-1, 1);
    }
  }

  // find all free times
  var freeTimes = []; // list of { startTime, endTime } objects
  if (mustItems.length == 0) {
    for (var d = 0; d < timeObject.dates.length; d++) {
      var date = new Date(timeObject.dates[d]);
      var startTime = new Date(date);
      startTime.setHours(todBegin);
      var endTime = new Date(date);
      endTime.setHours(todEnd);
      freeTimes.push({
        "startTime" : startTime.toISOString(),
        "endTime" : endTime.toISOString()
      });
    }
  } else {
    var i = 0;
    for (var d = 0; d < timeObject.dates.length; d++) {
      var currDate = new Date(timeObject.dates[d]);
      var busyListForDate = [];
      while (i < mustItems.length
        && new Date(mustItems[i].startTime).getFullYear() == currDate.getFullYear()
        && new Date(mustItems[i].startTime).getMonth() == currDate.getMonth()
        && new Date(mustItems[i].startTime).getDate() == currDate.getDate()) {
        busyListForDate.push(mustItems[i]);
        i++;
      }
      // append to free times array
      var rangeStart = new Date(currDate);
      rangeStart.setHours(todBegin); // TODO: figure out why this -5 is needed... time zone issue???
      var rangeEnd = new Date(currDate);
      rangeEnd.setHours(todEnd); // TODO: figure out why this -5 is needed... time zone issue???
      freeTimes.push.apply(freeTimes, findFreeTimes(rangeStart.toISOString(), rangeEnd.toISOString(), timeObject.duration, busyListForDate));
    }
  }

  var randomReturnIndex = Math.floor(Math.random() * (freeTimes.length - 1));
  var optimalMeetingTimeSlot = freeTimes[randomReturnIndex];
  optimalMeetingTimeSlot.startTime = moment(new Date(optimalMeetingTimeSlot.startTime)).format('YYYY-MM-DD h:mm a');
  optimalMeetingTimeSlot.endTime = moment(new Date(optimalMeetingTimeSlot.endTime)).format('YYYY-MM-DD h:mm a');
  timeObject.optimalMeetingTimeSlot = optimalMeetingTimeSlot;
console.log(timeObject);
  res.send(timeObject);
}

function timeEventFormatter(timeEvent) {
  var prettyTimeEvent = {};
  prettyTimeEvent.summary = timeEvent.summary;
  prettyTimeEvent.owner = timeEvent.items.length > 0 ?
    timeEvent.items[0].creator.displayName : timeEvent.summary;
  prettyTimeEvent.timeZone = timeEvent.timeZone;
  prettyTimeEvent.items = [];
  for(var i = 0; i < timeEvent.items.length; i++) {
    var rawItem = timeEvent.items[i];
    var itemInfo = {};
    itemInfo.summary = rawItem.summary == undefined ? "" : rawItem.summary;
    itemInfo.startTime = rawItem.start.dateTime == undefined ? rawItem.start.date : rawItem.start.dateTime;
    itemInfo.endTime = rawItem.end.dateTime == undefined ? rawItem.end.date : rawItem.end.dateTime;
    prettyTimeEvent.items.push(itemInfo);
  }

  return prettyTimeEvent;
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

function getCalData(calId, date, callback, type){
  googleConfig.calendarId = calId;
  var dateObj = new Date(date);
  // var today = moment().format('YYYY-MM-DD') + 'T';
  var dateString = dateObj.getFullYear()+'-'+(dateObj.getMonth()+1)+'-'+dateObj.getDate()+'T';
  // Call google to fetch events for dateString on our calendar
  calendar.events.list({
    calendarId: googleConfig.calendarId,
    maxResults: 20,
    timeMin: dateString + '00:00:00.000Z',
    timeMax: dateString + '23:59:59.000Z',
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