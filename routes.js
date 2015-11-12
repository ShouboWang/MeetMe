module.exports = function(app){
    var calendar_events = require('./controllers/userEvents');
    app.get('/userEvents/:username', userEvents.findByUsername);
    app.get('/userEvents/range', userEvents.findAll);
}