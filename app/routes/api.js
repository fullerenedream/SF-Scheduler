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
                                  description
                                FROM appointments`;
    con.query(appointmentQueryString, function(err, appt_rows) {
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
      }
      eventSources.push(appointments);
      response.eventSources = eventSources;
      console.log('response: ' + JSON.stringify(response));
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
      console.log('response: ' + JSON.stringify(response));
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
  var appointment = [
    req.body.appointment_type,
    req.body.title,
    req.body.tech_id,
    req.body.appt_date,
    req.body.appt_start_time,
    req.body.appt_end_time,
    req.body.appt_date + 'T' + req.body.appt_start_time, // start_time in ISO8601
    req.body.appt_date + 'T' + req.body.appt_end_time, // end_time in ISO8601
    req.body.customer_id,
    req.body.ticket_id,
    req.body.status,
    req.body.description,
    req.body.appointment_id
  ];

  for (i = 0; i < appointment.length; i++) {
    console.log(appointment[i]);
  }

  if (req.body.title == '') {req.body.title = 'No Title';}
  if (req.body.description == '') {req.body.description = 'No Description';}

  // appointment_id must be either blank (=new appointment) or a positive integer
  if ( (req.body.appointment_id != '') && isPositiveInt(req.body.appointment_id) == false ) {
    console.log('appointment_id is invalid: it is neither a positive integer nor an empty string');
  }
  // TODO: create validation for customer_id - must be blank (time off) or positive integer, matching an existing customer_id (TODO: make customers table)
  // TODO: create validation for tech_id - must be blank (On Deck/Unassigned) or an existing tech_id (= user_id in users table)

  // *** TODO: rewrite date and time logic
  // - if appointment_type = 10 (time off), date, times and tech_id are required
  // - else if no date or time -> appointment is On Deck
  // - else if date and time but no tech_id -> appointment is Unassigned
  // - if start time but no end time, find default duration from appointment_type and generate end time

  else if (isValidDate(req.body.appt_date) == false) {
    console.log('appt_date is invalid');
  }
  else if (isValidTime(req.body.appt_start_time) == false) {
    console.log('appt_start_time is invalid');
  }
  else if (isValidTime(req.body.appt_end_time) == false) {
    console.log('appt_end_time is invalid');
  }
  // **** TODO: create logic for appointment_type ***
  // TODO: improve validation for status - there should only be a few set statuses to choose from
  else if ( isInt(req.body.status) == false ) {
    console.log('appointment status is invalid: it is not a positive integer');
  }

  // if appointment_id is valid, appointment with that id is updated in the db
  else if (isPositiveInt(req.body.appointment_id)) {
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
  // if no appointment_id is given, a new appointment is created in the db
  // *** TODO: check if new appointment is in the past, and write a warning that requires an OK to continue creating it
  else if (req.body.appointment_id == '') {
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
  var appointment_id = req.param('appointment_id');
  var key = appointment_id;

  if (isPositiveInt(appointment_id) == false) {
    console.log('appointment_id is invalid: it is not a positive integer');
  }
  var appointmentQueryString = `DELETE FROM appointments
                            WHERE appointment_id = ?`;
  con.query(appointmentQueryString, [key], function(err, result){
    if(err) throw err;
    else {
      console.log('deleting appointment row with appointment_id ' + appointment_id);
      res.json("success"); // response says whether save was success or failure - TODO: make this a useful response message
    }
  });
});



// TODO: move validation helper functions into a different file

function isInt(val) {
  // check that input is a number
  if (isNaN(val)) {
    console.log(val + ' is not a number');
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



module.exports = router;
