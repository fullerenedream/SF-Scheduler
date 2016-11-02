var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var moment = require('../public/fullcalendar-scheduler-1.4.0/lib/moment.min.js');
var fs = require('fs');
var sampleData = require('../data/sample.json');
var process_data = require('../public/scripts/process_data.js');
// *** added the db.js and technician_schedules.js files pretty much as-is from NeoNodoSchedule
var db = require("../db.js");
var technician_schedules = require("../technician_schedules.js");
var eventSources = [];
var todayDate = new Date().toISOString().substring(0,10);

// GET each tech's most recent working hours from technician_schedules table
router.get('/api/technician_schedules', function(req,res){
  var con = db.connectToScheduleDB();
  var queryString =  `SELECT t1.schedule_id, t1.user_id, t1.user_name,
                        IFNULL(sunday_start,"00:00:00") sunday_start,
                        IFNULL(sunday_end,"00:00:01") sunday_end,
                        IFNULL(monday_start,"00:00:00") monday_start,
                        IFNULL(monday_end,"00:00:01") monday_end,
                        IFNULL(tuesday_start,"00:00:00") tuesday_start,
                        IFNULL(tuesday_end,"00:00:01") tuesday_end,
                        IFNULL(wednesday_start,"00:00:00") wednesday_start,
                        IFNULL(wednesday_end,"00:00:01") wednesday_end,
                        IFNULL(thursday_start,"00:00:00") thursday_start,
                        IFNULL(thursday_end,"00:00:01") thursday_end,
                        IFNULL(friday_start,"00:00:00") friday_start,
                        IFNULL(friday_end,"00:00:01") friday_end,
                        IFNULL(saturday_start,"00:00:00") saturday_start,
                        IFNULL(saturday_end,"00:00:01") saturday_end
                    FROM technician_schedules t1
                    WHERE t1.created_at = (
                      SELECT MAX(t2.created_at)
                      FROM technician_schedules t2
                      WHERE t2.user_id = t1.user_id)`;
  con.query(queryString,function(err,ts_rows){
    if(err) throw err;
    console.log('\nAll current technician schedules:\n');
    console.log('ts_rows:\n' + ts_rows);

    var response = new Object();
    var resources = []; // array of working hours of all techs

    // iterate over ts_rows into a valid JSON string
    for (var i = 0; i < ts_rows.length; i++) {
      console.log('ts_rows ' + i + ':\n' + ts_rows[i]);
      console.log('ts_rows ' + i + ' user_id:\n' + ts_rows[i].user_id);
      // one resource is one tech's working hours
      var resource = new Object();
      resource.businessHours = [];
      resource.id = ts_rows[i].user_id;
      resource.title = ts_rows[i].user_name;
      resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end};
      resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end};
      resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end};
      resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end};
      resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end};
      resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end};
      resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end};

      resources.push(resource);
    }
    response.resources = resources;
    res.json(response);
  });
});



// GET the most recent working hours of a given tech (identified by user_id) from technician_schedules table
router.get('/api/technician_schedules/:user_id', function(req,res){
  var con = db.connectToScheduleDB();
  var user_id = req.param('user_id');
  var key = user_id;
  var queryString =  `SELECT t1.schedule_id, t1.user_id, t1.user_name,
                        IFNULL(sunday_start,"00:00:00") sunday_start,
                        IFNULL(sunday_end,"00:00:01") sunday_end,
                        IFNULL(monday_start,"00:00:00") monday_start,
                        IFNULL(monday_end,"00:00:01") monday_end,
                        IFNULL(tuesday_start,"00:00:00") tuesday_start,
                        IFNULL(tuesday_end,"00:00:01") tuesday_end,
                        IFNULL(wednesday_start,"00:00:00") wednesday_start,
                        IFNULL(wednesday_end,"00:00:01") wednesday_end,
                        IFNULL(thursday_start,"00:00:00") thursday_start,
                        IFNULL(thursday_end,"00:00:01") thursday_end,
                        IFNULL(friday_start,"00:00:00") friday_start,
                        IFNULL(friday_end,"00:00:01") friday_end,
                        IFNULL(saturday_start,"00:00:00") saturday_start,
                        IFNULL(saturday_end,"00:00:01") saturday_end
                    FROM technician_schedules t1
                    WHERE t1.user_id = ?
                    AND t1.created_at = (
                      SELECT MAX(t2.created_at)
                      FROM technician_schedules t2
                      WHERE t2.user_id = t1.user_id)`;
  var con = db.connectToScheduleDB(); // ********* pretty sure this should be deleted - check later
  con.query(queryString, [key], function(err,ts_rows){
    if(err) throw err;
    console.log('\nSchedule of Tech with user_id = ' + user_id + ':');
    console.log(ts_rows);

    var response = new Object();
    var resources = []; // array containing current working hours of this tech
    var this_tech = ts_rows[0];

    // one resource is one tech's working hours
    var resource = new Object();
    resource.businessHours = [];
    resource.id = this_tech.user_id;
    resource.title =this_tech.user_name;
    resource.businessHours[0] = {dow:[0], start:this_tech.sunday_start, end:this_tech.sunday_end};
    resource.businessHours[1] = {dow:[1], start:this_tech.monday_start, end:this_tech.monday_end};
    resource.businessHours[2] = {dow:[2], start:this_tech.tuesday_start, end:this_tech.tuesday_end};
    resource.businessHours[3] = {dow:[3], start:this_tech.wednesday_start, end:this_tech.wednesday_end};
    resource.businessHours[4] = {dow:[4], start:this_tech.thursday_start, end:this_tech.thursday_end};
    resource.businessHours[5] = {dow:[5], start:this_tech.friday_start, end:this_tech.friday_end};
    resource.businessHours[6] = {dow:[6], start:this_tech.saturday_start, end:this_tech.saturday_end};

    resources.push(resource);
    response.resources = resources;
    res.json(response);
  });
});



// GET all appointments
router.get('/api/appointments', function(req,res){
  var con = db.connectToScheduleDB();
  var appointmentQueryString = `SELECT appointment_id,
                                  appointment_type,
                                  title,
                                  tech_id,
                                  appt_date,
                                  appt_start_time,
                                  appt_end_time,
                                  appt_start_iso_8601,
                                  appt_end_iso_8601,
                                  customer_id,
                                  ticket_id,
                                  status,
                                  description
                                FROM appointments`;
  con.query(appointmentQueryString, function(err, appt_rows) {
    if(err) throw err;
    console.log('\nAll appointments:\n');
    console.log('appt_rows:\n' + appt_rows);
    var response = new Object();
    var appointments = [];
    eventSources = [];

    // iterate over appt_rows into a valid JSON string
    for (var i = 0; i < appt_rows.length; i++) {
      console.log('appt_rows ' + i + ':\n' + appt_rows[i]);
      console.log('appt_rows ' + i + ' ticket_id:\n' + appt_rows[i].ticket_id);
      var appointment = new Object();
      appointment.id = appt_rows[i].appointment_id;
      appointment.appointmentType = appt_rows[i].appointment_type;
      appointment.title = appt_rows[i].title;
      // ************************ comment out for testing events without resources
      // appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
      appointment.start = appt_rows[i].appt_start_iso_8601;
      appointment.end = appt_rows[i].appt_end_iso_8601;
      appointment.customerId = appt_rows[i].customer_id;
      appointment.ticketId = appt_rows[i].ticket_id;
      appointment.status = appt_rows[i].status;  // (0, 1 or 2)
      appointment.description = appt_rows[i].description;
      appointments.push(appointment);
      // console.log(appointment);
    }
    eventSources.push(appointments);
    response.eventSources = eventSources;
    // for debugging purposes
    // response = appt_rows;
    res.json(response);
  });
});



// GET an appointment by appointment_id
router.get('/api/appointments/:appointment_id', function(req,res){
  var con = db.connectToScheduleDB();
  var appointment_id = req.param('appointment_id');
  var key = appointment_id;
  var appointmentQueryString = `SELECT appointment_id,
                                  appointment_type,
                                  title,
                                  tech_id,
                                  appt_date,
                                  appt_start_time,
                                  appt_end_time,
                                  appt_start_iso_8601,
                                  appt_end_iso_8601,
                                  customer_id,
                                  ticket_id,
                                  status,
                                  description
                                FROM appointments
                                WHERE appointment_id = ?`;
  con.query(appointmentQueryString, [key], function(err, appt_rows) {
    if(err) throw err;
    console.log('\nAppointment ' + appointment_id + ':\n');
    console.log('appt_rows:\n' + appt_rows);
    var response = new Object();
    var appointments = [];
    var this_appt = appt_rows[0];
    eventSources = [];

    var appointment = new Object();
    appointment.id = this_appt.appointment_id;
    appointment.appointmentType = this_appt.appointment_type;
    appointment.title = this_appt.title;
    // ************************ comment out for testing events without resources
    // appointment.resourceId = this_appt.tech_id;
    appointment.start = this_appt.appt_start_iso_8601;
    appointment.end = this_appt.appt_end_iso_8601;
    appointment.customerId = this_appt.customer_id;
    appointment.ticketId = this_appt.ticket_id;
    appointment.status = this_appt.status;  // (0, 1 or 2)
    appointment.description = this_appt.description;
    appointments.push(appointment);
    eventSources.push(appointments);
    response.eventSources = eventSources;
    res.json(response);
  });
});


// GET all calendar_itemtypes
router.get('/api/calendar_itemtypes', function(req,res){
  var con = db.connectToScheduleDB();
  var ciTypesQueryString = `SELECT ci_type_id,
                              ci_type_name,
                              ci_type_description,
                              ci_type_durationminutes,
                              ci_type_color,
                              ci_type_enabled,
                              ci_type_order,
                              ci_type_visible
                            FROM calendar_itemtypes`;
  con.query(ciTypesQueryString,function(err,ciTypes_rows){
    if(err) throw err;
    var response = new Object();
    var ciTypes = [];

    // iterate over ciTypes_rows into a valid JSON string
    for (var i = 0; i < ciTypes_rows.length; i++) {
      console.log('ciTypes_rows ' + i + ':\n' + ciTypes_rows[i]);
      var ciType = new Object();
      ciType.id = ciTypes_rows[i].ci_type_id;
      ciType.name = ciTypes_rows[i].ci_type_name;
      ciType.description = ciTypes_rows[i].ci_type_description;
      ciType.duration = ciTypes_rows[i].ci_type_durationminutes;
      ciType.color = ciTypes_rows[i].ci_type_color;
      ciType.enabled = ciTypes_rows[i].ci_type_enabled;
      ciType.order = ciTypes_rows[i].ci_type_order;
      ciType.visible = ciTypes_rows[i].ci_type_visible;
      ciTypes.push(ciType);
    }
    response.ciTypes = ciTypes;
    res.json(response);
  });
});


// GET all users from users table
router.get('/api/users', function(req,res){
  var con = db.connectToScheduleDB();
  var usersQueryString = `SELECT user_id,
                              user_type,
                              username,
                              email
                            FROM users`;
  con.query(usersQueryString,function(err,users_rows){
    if(err) throw err;
    var response = new Object();
    var users = [];

    // iterate over users_rows into a valid JSON string
    for (var i = 0; i < users_rows.length; i++) {
      console.log('users_rows ' + i + ':\n' + users_rows[i]);
      var user = new Object();
      user.id = users_rows[i].user_id;
      user.type = users_rows[i].user_type;
      user.username = users_rows[i].username;
      user.email = users_rows[i].email;
      users.push(user);
    }
    response.users = users;
    res.json(response);
  });
});



// GET a user by user_id
router.get('/api/users/:user_id', function(req,res){
  var con = db.connectToScheduleDB();
  var user_id = req.param('user_id');
  var key = user_id;
  var usersQueryString = `SELECT user_id,
                              user_type,
                              username,
                              email
                            FROM users
                            WHERE user_id = ?`;
  con.query(usersQueryString, [key], function(err,users_rows){
    if(err) throw err;
    var response = new Object();
    var users = [];
    var this_user = users_rows[0];

    var user = new Object();
    user.id = this_user.user_id;
    user.type = this_user.user_type;
    user.username = this_user.username;
    user.email = this_user.email;
    users.push(user);

    response.users = users;
    res.json(response);
  });
});



// GET all the resources and events - technician working hours + appointments
router.get('/api/resources_and_events', function(req,res){
  var con = db.connectToScheduleDB();
  var response = new Object();
  // using eventSources array to combine appointments and time_off events - TODO: undo this
  var eventSources = [];

  // get all technician working hours
  var tsQueryString =  `SELECT t1.schedule_id, t1.user_id, t1.user_name,
                        IFNULL(sunday_start,"00:00:00") sunday_start,
                        IFNULL(sunday_end,"00:00:01") sunday_end,
                        IFNULL(monday_start,"00:00:00") monday_start,
                        IFNULL(monday_end,"00:00:01") monday_end,
                        IFNULL(tuesday_start,"00:00:00") tuesday_start,
                        IFNULL(tuesday_end,"00:00:01") tuesday_end,
                        IFNULL(wednesday_start,"00:00:00") wednesday_start,
                        IFNULL(wednesday_end,"00:00:01") wednesday_end,
                        IFNULL(thursday_start,"00:00:00") thursday_start,
                        IFNULL(thursday_end,"00:00:01") thursday_end,
                        IFNULL(friday_start,"00:00:00") friday_start,
                        IFNULL(friday_end,"00:00:01") friday_end,
                        IFNULL(saturday_start,"00:00:00") saturday_start,
                        IFNULL(saturday_end,"00:00:01") saturday_end
                    FROM technician_schedules t1
                    WHERE t1.created_at = (
                      SELECT MAX(t2.created_at)
                      FROM technician_schedules t2
                      WHERE t2.user_id = t1.user_id)`;
  con.query(tsQueryString,function(err,ts_rows){
    if(err) throw err;
    var resources = [];
    for (var i = 0; i < ts_rows.length; i++) {
      // console.log('ts_rows ' + i + ' user_name:\n' + ts_rows[i].user_name);
      // console.log('ts_rows ' + i + ':\n' + ts_rows[i]);
      var resource = new Object();
      resource.businessHours = [];
      resource.id = ts_rows[i].user_id;
      resource.title = ts_rows[i].user_name;
      resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end};
      resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end};
      resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end};
      resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end};
      resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end};
      resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end};
      resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end};
      resources.push(resource);
    }
    response.resources = resources;

    // get all appointments
    var appointmentQueryString = `SELECT appointment_id,
                                  appointment_type,
                                  title,
                                  tech_id,
                                  appt_date,
                                  appt_start_time,
                                  appt_end_time,
                                  appt_start_iso_8601,
                                  appt_end_iso_8601,
                                  customer_id,
                                  ticket_id,
                                  status,
                                  description,
                                  ci_type_color
                                FROM appointments
                                LEFT JOIN calendar_itemtypes
                                ON appointments.appointment_type = calendar_itemtypes.ci_type_id`;
    con.query(appointmentQueryString, function(err, appt_rows) {
      if(err) throw err;
      var appointments = [];
      var onDeckEvents = [];
      for (var i = 0; i < appt_rows.length; i++) {
        // console.log('appt_rows ' + i + ':\n' + appt_rows[i]);
        // console.log('appt_rows ' + i + ' ticket_id:\n' + appt_rows[i].ticket_id);
        var appointment = new Object();
        appointment.id = appt_rows[i].appointment_id;
        appointment.appointmentType = appt_rows[i].appointment_type;
        appointment.title = appt_rows[i].title;
        // ************************ comment out for testing events without resources
        appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
        appointment.start = appt_rows[i].appt_start_iso_8601;
        appointment.end = appt_rows[i].appt_end_iso_8601;
        appointment.customerId = appt_rows[i].customer_id;
        appointment.ticketId = appt_rows[i].ticket_id;
        appointment.status = appt_rows[i].status;  // (0, 1 or 2)
        appointment.description = appt_rows[i].description;
        appointment.color = appt_rows[i].ci_type_color;

        if (appointment.status == 2) {
          appointment.borderColor = appointment.color;
          appointment.color = '#666666';
        }
        if (appointment.start == '' || appointment.start == null) {
          appointment.className = 'onDeck';
          onDeckEvents.push(appointment);
        }
        else {
          appointments.push(appointment);
        }
      }
      eventSources.push(appointments);
      eventSources.push(onDeckEvents);
      response.eventSources = eventSources;
      console.log('response: ' + JSON.stringify(response));
      console.log('sending response');
      res.json(response);
    }); // closes 'con.query(appointmentQueryString,function(err,appt_rows)'
  }); // closes 'con.query(tsQueryString,function(err,ts_rows)'
}); // closes 'router.get('/api/resources_and_events', function(req,res)'



// GET one resource and all its events - technician working hours + appointments
router.get('/api/resources_and_events/:user_id', function(req,res){
  var con = db.connectToScheduleDB();
  var user_id = req.param('user_id');
  var key = user_id;
  console.log('inside GET request for one resource and all its events - /api/resources_and_events/' + user_id);
  var response = new Object();
  // using eventSources array to combine appointments and time_off events - TODO: undo this
  var eventSources = [];
  // get this technician's working hours
  var tsQueryString =  `SELECT schedule_id,
                          user_id,
                          user_name,
                          IFNULL(sunday_start,"00:00:00") sunday_start,
                          IFNULL(sunday_end,"00:00:01") sunday_end,
                          IFNULL(monday_start,"00:00:00") monday_start,
                          IFNULL(monday_end,"00:00:01") monday_end,
                          IFNULL(tuesday_start,"00:00:00") tuesday_start,
                          IFNULL(tuesday_end,"00:00:01") tuesday_end,
                          IFNULL(wednesday_start,"00:00:00") wednesday_start,
                          IFNULL(wednesday_end,"00:00:01") wednesday_end,
                          IFNULL(thursday_start,"00:00:00") thursday_start,
                          IFNULL(thursday_end,"00:00:01") thursday_end,
                          IFNULL(friday_start,"00:00:00") friday_start,
                          IFNULL(friday_end,"00:00:01") friday_end,
                          IFNULL(saturday_start,"00:00:00") saturday_start,
                          IFNULL(saturday_end,"00:00:01") saturday_end
                        FROM technician_schedules
                        WHERE user_id = ?
                        ORDER BY created_at DESC LIMIT 1`;

  con.query(tsQueryString, [key], function(err,ts_rows){
    if(err) throw err;
    var resources = [];
    for (var i = 0; i < ts_rows.length; i++) {
      // console.log('ts_rows ' + i + ' user_name:\n' + ts_rows[i].user_name);
      // console.log('ts_rows ' + i + ':\n' + ts_rows[i]);
      var resource = new Object();
      resource.businessHours = [];
      resource.id = ts_rows[i].user_id;
      resource.title = ts_rows[i].user_name;
      resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end};
      resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end};
      resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end};
      resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end};
      resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end};
      resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end};
      resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end};
      resources.push(resource);
    }
    response.resources = resources;

    // get all appointments
    var appointmentQueryString = `SELECT appointment_id,
                                    appointment_type,
                                    title,
                                    tech_id,
                                    appt_date,
                                    appt_start_time,
                                    appt_end_time,
                                    appt_start_iso_8601,
                                    appt_end_iso_8601,
                                    customer_id,
                                    ticket_id,
                                    status,
                                    description
                                  FROM appointments
                                  WHERE tech_id = ?`;
    con.query(appointmentQueryString, [key], function(err,appt_rows){
      if(err) throw err;
      var appointments = [];
      for (var i = 0; i < appt_rows.length; i++) {
        // console.log('appt_rows ' + i + ':\n' + appt_rows[i]);
        // console.log('appt_rows ' + i + ' ticket_id:\n' + appt_rows[i].ticket_id);
        var appointment = new Object();
        appointment.id = appt_rows[i].appointment_id;
        appointment.appointmentType = appt_rows[i].appointment_type;
        appointment.title = appt_rows[i].title;
        // ************************ comment out for testing events without resources
        appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
        appointment.start = appt_rows[i].appt_start_iso_8601;
        appointment.end = appt_rows[i].appt_end_iso_8601;
        appointment.customerId = appt_rows[i].customer_id;
        appointment.ticketId = appt_rows[i].ticket_id;
        appointment.status = appt_rows[i].status;  // (0, 1 or 2)
        appointment.description = appt_rows[i].description;
        appointments.push(appointment);
        // console.log(appointment);
      }
      eventSources.push(appointments);
      response.eventSources = eventSources;
      // console.log('response: ' + JSON.stringify(response));
      console.log('sending response');
      res.json(response);
    }); // closes 'con.query(appointmentQueryString,function(err,appt_rows)'
  }); // closes 'con.query(tsQueryString,function(err,ts_rows)'
}); // closes 'router.get('/api/resources_and_events', function(req,res)'




router.use(bodyParser.json());
// parses data from form into JSON, so then you access e.g. 'name' field from form
// as req.body.name ... if you want all the data from the form, you access it as
// req.body
router.use(bodyParser.urlencoded({ extended: false }));
// parses urlencoded bodies


// CREATE or UPDATE event
// receive a form post for an appointment and save it to the database
router.post('/api/appointments', function (req, res) {

  // build date & times out of ISO8601 or vice versa, as needed
  if ( isValidISO8601(req.body.appt_start_iso_8601) ) {
    if (req.body.appt_date == null) {
      req.body.appt_date = req.body.appt_start_iso_8601.substring(0, 10);
    }
    if (req.body.appt_start_time == null) {
      req.body.appt_start_time = req.body.appt_start_iso_8601.substring(11);
    }
  }
  if ( isValidISO8601(req.body.appt_end_iso_8601) ) {
    if (req.body.appt_end_time == null) {
      req.body.appt_end_time = req.body.appt_end_iso_8601.substring(11);
    }
  }
  if ( isValidDate(req.body.appt_date) ) {
    if (req.body.appt_start_iso_8601 == null && isValidTime(req.body.appt_start_time) ){
      req.body.appt_start_iso_8601 = req.body.appt_date + 'T' + req.body.appt_start_time;
    }
    if (req.body.appt_end_iso_8601 == null && isValidTime(req.body.appt_end_time) ){
      req.body.appt_end_iso_8601 = req.body.appt_date + 'T' + req.body.appt_end_time;
    }
  }

  var appointment = [
    req.body.appointment_type,    // 0
    req.body.title,               // 1
    req.body.tech_id,             // 2
    req.body.appt_date,           // 3
    req.body.appt_start_time,     // 4
    req.body.appt_end_time,       // 5
    req.body.appt_start_iso_8601, // 6
    req.body.appt_end_iso_8601,   // 7
    req.body.customer_id,         // 8
    req.body.ticket_id,           // 9
    req.body.status,              // 10
    req.body.description,         // 11
    req.body.appointment_id       // 12
  ];

  for (i = 0; i < appointment.length; i++) {
    console.log(appointment[i]);
  }

  if (req.body.title == null || req.body.title == '') {appointment[1] = 'No Title';}
  if (req.body.description == null || req.body.description == '') {appointment[11] = 'No Description';}

  // appointment_id must be either blank (=new appointment) or a positive integer
  if ( isBlankOrNull(req.body.appointment_id) || !isPositiveInt(req.body.appointment_id) ) {
    console.log('appointment_id is invalid: it is neither blank nor a positive integer. appointment_id: ' + req.body.appointment_id);
  }
  else {
    console.log('appointment_id is valid: ' + req.body.appointment_id);
  }

  // TODO: improve validation for status - there should only be a few set statuses to choose from
  // - and there should be a default status - let's say it's 0
  if ( (req.body.status == null) || (isInt(req.body.status) == false) ) {
    console.log('appointment status is invalid: it is not an integer - setting it to 0');
    appointment[10] = 0;
  }

  // TODO: create validation for customer_id - must be blank (time off) or positive integer, matching an existing customer_id (TODO: make customers table)
  // TODO: create validation for tech_id - must be blank (On Deck/Unassigned) or an existing tech_id (= user_id in users table)

  // *** appointment_type, date and time logic
  // - if has no tech_id, is not Time Off, and has date and start time -> appointment is Unassigned
  // - if not Unassigned, date and start time are required
  // - if appointment is Time Off, date, times and tech_id are required
  // - if not Time Off, and has no date or start time -> appointment is On Deck
  // *** TODO: if appointment (not Time Off) has start time but no end time, find default duration from appointment_type and generate end time


  // *** TODO: figure out the right order for these and set up some else-if's or something
  // because these don't all need to run every time

  // Time Off - require date, times and tech_id
  if (isTimeOff(appointment)) {
    console.log('appointment ' + req.body.title + ' is Time Off - it will be a different color');
    // require date
    if (isValidDate(req.body.appt_date) == false) {
    console.log('appt_date is invalid - please try again');
    }
    // require start time and end time... TODO: change so that blank start or end time makes Time Off be All Day
    else if (isValidTime(req.body.appt_start_time) == false) {
      console.log('appt_start_time is invalid - please try again');
    }
    else if (isValidTime(req.body.appt_end_time) == false) {
      console.log('appt_end_time is invalid - please try again');
    }
    // require tech_id to be of an existing tech
    // WARNING: tech_id's are temporarily hard-coded (to 1, 2, and 3) in isValidTechId()
    else if (!isValidTechId(req.body.tech_id)) {
      console.log('there is no tech with tech_id ' + req.body.tech_id + ' - please try again');
    }
    // we have cleared the validations, now create or update the Time Off appointment
    // if appointment_id is valid, appointment with that id is updated in the db
    else if (isPositiveInt(req.body.appointment_id)) {
      updateAppointment();
    }
    // if no appointment_id is given, a new appointment is created in the db
    // *** TODO: check if new appointment is in the past, and write a warning that requires an OK to continue creating it
    else if (isBlankOrNull(req.body.appointment_id)) {
      createAppointment();
    }
  } // end Time Off section


  // Unassigned - set tech_id to 0 so appointment goes into Unassigned column
  if (isUnassigned(appointment)) {
    console.log('Unassigned. Setting tech_id to 0');
    appointment[2] = 0;
  } // end Unassigned section


  // On Deck: if appointment is not time off, and date or start time are blank, appointment is an On Deck item
  // TODO: feed On Deck appointments to makeOnDeckSection() in scheduler.js
  if (isOnDeck(appointment)) {
    console.log('On Deck appointment - needs to be fed to makeOnDeckSection() in scheduler.js');
    // WARNING: appointment_type values are temporarily hard-coded in this function
    if (isValidAppointmentType(req.body.appointment_type) == false) {
      console.log('appointment_type is invalid - please try again');
    }
    else if (isBlankOrNull(req.body.customer_id)) {
      console.log('please enter a Customer ID');
    }
    else if (isBlankOrNull(req.body.ticket_id)) {
      console.log('please enter a Ticket ID');
    }

    // we have cleared the validations, now create or update the On Deck appointment
    // if appointment_id is valid, appointment with that id is updated in the db
    else if (isPositiveInt(req.body.appointment_id)) {
      updateAppointment();
    }
    // if no appointment_id is given, a new appointment is created in the db
    // *** TODO: check if new appointment is in the past, and write a warning that requires an OK to continue creating it
    else if (isBlankOrNull(req.body.appointment_id)) {
      createAppointment();
    }
  } // end On Deck section


  // Regular Appointment - requires tech_id, date, start time, appointment_type, customer_id, ticket_id
  // TODO: figure out if more validations are necessary, and if so, create them
  if ( !isTimeOff(appointment) ) {
    // require tech_id to be of an existing tech
    // WARNING: tech_id's are temporarily hard-coded (to 1, 2, and 3) in isValidTechId()
    if (!isValidTechId(req.body.tech_id)) {
      console.log('there is no tech with tech_id ' + req.body.tech_id + ' - please try again');
    }
    if (isValidDate(req.body.appt_date) == false) {
    console.log('appt_date is invalid - please try again');
    }
    // require start time and end time... TODO: change so that blank start or end time makes Time Off be All Day
    else if (isValidTime(req.body.appt_start_time) == false) {
      console.log('appt_start_time is invalid - please try again');
    }
    // WARNING: appointment_type values are temporarily hard-coded in this function
    else if (isValidAppointmentType(req.body.appointment_type) == false) {
      console.log('appointment_type is invalid - please try again');
    }
    else if (isBlankOrNull(req.body.customer_id)) {
      console.log('please enter a Customer ID');
    }
    else if (isBlankOrNull(req.body.ticket_id)) {
      console.log('please enter a Ticket ID');
    }

    // we have cleared the validations, now create or update the Time Off appointment
    // if appointment_id is valid, appointment with that id is updated in the db
    else if (isPositiveInt(req.body.appointment_id)) {
      updateAppointment();
    }
    // if no appointment_id is given, a new appointment is created in the db
    // *** TODO: check if new appointment is in the past, and write a warning that requires an OK to continue creating it
    else if (isBlankOrNull(req.body.appointment_id)) {
      createAppointment();
    }
  } // end Regular Appointment section




  // if (isValidDate(req.body.appt_date) == false) {
  //   console.log('appt_date is invalid');
  // }
  // else if (isValidTime(req.body.appt_start_time) == false) {
  //   console.log('appt_start_time is invalid');
  // }
  // else if (isValidTime(req.body.appt_end_time) == false) {
  //   console.log('appt_end_time is invalid');
  // }


  // // if appointment_id is valid, appointment with that id is updated in the db
  // else if (isPositiveInt(req.body.appointment_id)) {
  //   updateAppointment();
  // }
  // // if no appointment_id is given, a new appointment is created in the db
  // // *** TODO: check if new appointment is in the past, and write a warning that requires an OK to continue creating it
  // else if (req.body.appointment_id == null) {
  //   createAppointment();
  // }

  function updateAppointment() {
    var con = db.connectToScheduleDB();
    var appointmentQueryString = `UPDATE appointments
                                  SET appointment_type = ?,
                                    title = ?,
                                    tech_id = ?,
                                    appt_date = ?,
                                    appt_start_time = ?,
                                    appt_end_time = ?,
                                    appt_start_iso_8601 = ?,
                                    appt_end_iso_8601 = ?,
                                    customer_id = ?,
                                    ticket_id = ?,
                                    status = ?,
                                    description = ?
                                  WHERE appointment_id = ?;`;

    con.query(appointmentQueryString, appointment, function(err, result){
      if(err) throw err;
      else {
        console.log('appointmentQueryString sent to db as update to existing item');
        console.log('affected rows: ' + result.affectedRows);
        res.json("success"); // response says whether save was success or failure - TODO: make this a useful response message
      }
    });
  }

  function createAppointment() {
    var con = db.connectToScheduleDB();
    var appointmentQueryString = `INSERT INTO appointments
                                   (appointment_type,
                                    title,
                                    tech_id,
                                    appt_date,
                                    appt_start_time,
                                    appt_end_time,
                                    appt_start_iso_8601,
                                    appt_end_iso_8601,
                                    customer_id,
                                    ticket_id,
                                    status,
                                    description)
                                  VALUES
                                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    con.query(appointmentQueryString, appointment, function(err, result){
      if(err) throw err;
      else {
        console.log('appointmentQueryString sent to db as new item. appointment_id = ' + result.insertId);
        console.log('affected rows: ' + result.affectedRows);
        res.json("success"); // response says whether save was success or failure - TODO: make this a useful response message
      }
    });
  }

});


// DELETE an appointment, specified by appointment_id
// **** TODO: GET THIS WORKING PROPERLY
router.delete('/api/appointment/:id', function(req, res) {
  var con = db.connectToScheduleDB();
  var appointment_id = req.param('id');
  var key = appointment_id;

  if (isPositiveInt(appointment_id) == false) {
    console.log('appointment_id is invalid: it is not a positive integer');
  }
  var appointmentQueryString = `DELETE FROM appointments WHERE appointment_id = ?`;
  con.query(appointmentQueryString, [key], function(err, result){
    if(err) throw err;
    else {
      console.log('deleting appointment row with appointment_id ' + appointment_id);
      res.json("success"); // response says whether save was success or failure - TODO: make this a useful response message
    }
  });
});



// TODO: move validation helper functions into a different file

function isBlankOrNull(val) {
  if (val == '') {
    console.log('val is blank');
    return true;
  }
  else if (val == null) {
    console.log('val is null');
    return true;
  }
  else {
    console.log('val is not blank or null. val: ' + val);
    return false;
  }
}

function isInt(val) {
  // check that input is a number
  if (isNaN(val)) {
    console.log(val + ' is not a number');
    return false;
  }
  else if (val == null) {
    console.log(val + ' is null');
    return false;
  }
  // check that input is an integer
  else if(val % 1 != 0){
    console.log(val + ' is not an integer');
    return false;
  }
  // All tests have passed, so return true
  else {
    console.log(val + ' is an integer');
    return true;
  }
}

function isPositiveInt(val) {
  if (isInt(val) == false) {
    console.log(val + ' is a not an integer');
  }
  // check that input is greater than zero
  else if (val <= 0) {
    console.log(val + ' is a not a positive number');
    return false;
  }
  // All tests have passed, so return true
  else {
    console.log(val + ' is a positive integer');
    return true;
  }
}

function isValidDate(date) {
  if ( moment(date, 'YYYY-MM-DD', true).isValid() == false ) {
    console.log('invalid date: it is not of the form YYYY-MM-DD');
    return false;
  }
  else return true;
}

function isValidTime(time) {
  if ( moment(time, 'HH:mm:ss', true).isValid() == false ) {
    console.log('invalid time: it is not of the form HH:mm:ss');
    return false;
  }
  else return true;
}

function isValidISO8601(ISO8601) {
  if ( moment(ISO8601, 'YYYY-MM-DDTHH:mm:ss', true).isValid() == false ) {
    console.log(ISO8601 + ' is invalid ISO8601: it is not of the form YYYY-MM-DDTHH:mm:ss');
    return false;
  }
  else {
  console.log(ISO8601 + ' is valid ISO8601');
  return true;
  }
}

function hasDateAndStartTime(appointment) {
  if ( isValidDate(appointment[3]) && isValidTime(appointment[4]) ) {
    console.log('appointment has valid date and start time');
    return true;
  }
  else if ( isValidISO8601(appointment[6]) ){
    console.log('appointment has valid ISO8601 start time');
    return true;
  }
  else {
    console.log('appointment is missing date and/or start time');
    return false;
  }
}

function hasDateStartAndEndTime(appointment) {
  if ( isValidDate(appointment[3]) && isValidTime(appointment[4]) && isValidTime(appointment[5])) {
    console.log('appointment has valid date, start and end times');
    return true;
  }
  else if ( isValidISO8601(appointment[6]) && isValidISO8601(appointment[7]) ){
    console.log('appointment has valid ISO8601 start and end times');
    return true;
  }
  else {
    console.log('appointment is missing date, start or end time');
    return false;
  }
}

// WARNING: tech_id's are temporarily hard-coded in this function
// TODO: make function check to see if this tech_id exists in db
function isValidTechId(tech_id) {
  if (tech_id == 1 || tech_id == 2 || tech_id == 3) {
    console.log('valid tech_id: ' + tech_id);
    return true;
  }
  else {
    console.log('invalid tech_id: ' + tech_id);
    return false;
  }
}

// WARNING: appointment_type values are temporarily hard-coded in this function
// TODO: make function check to see if this appointment_type exists in db
function isValidAppointmentType(appointment_type) {
  if ( (appointment_type >= 1 && appointment_type <= 5) || appointment_type == 8 || appointment_type == 10 ) {
    console.log('appointment_type is valid');
    return true;
  }
  else {
    console.log('appointment_type is invalid');
    return false;
  }
}

  // *** TODO: rewrite appointment_type, date and time logic
  // - if has no tech_id, is not Time Off, and has date and start time -> appointment is Unassigned
  // - if not Unassigned, date and start time are required
  // - if appointment is Time Off, date, times and tech_id are required
  // - if not Time Off, and has no date or start time -> appointment is On Deck
  // - if has start time but no end time, find default duration from appointment_type and generate end time

// checks appointment_type to see if it is Time Off (=10)
function isTimeOff(appointment) {
  if (appointment[0] == '10') {
    console.log(appointment[0]);
    console.log('appointment is Time Off');
  }
  else {
    console.log(appointment[0]);
    console.log('appointment is not Time Off');
  }
  return appointment[0] == '10' ? true : false;
}

// if appointment is not time off, and date or start time are blank or null, appointment is an On Deck item
function isOnDeck(appointment) {
  if (  (!isTimeOff(appointment)) && ( isBlankOrNull(appointment[3]) || isBlankOrNull(appointment[4]) )  ) {
    console.log('appointment is On Deck');
    return true;
  }
  else {
    console.log('appointment is not On Deck');
    return false;
  }
}

// if appointment has no tech_id, is not Time off, has date and time -> appointment is Unassigned
function isUnassigned(appointment) {
  if ( isBlankOrNull(appointment[2]) && (!isTimeOff(appointment)) &&  isValidDate(appointment[3]) && isValidTime(appointment[4]) && isValidTime(appointment[5]) ) {
    console.log('appointment is Unassigned');
    return true;
  }
  else {
    console.log('appointment is not Unassigned');
    return false;
  }
}


module.exports = router;
