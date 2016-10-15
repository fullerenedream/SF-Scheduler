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
                                  title,
                                  ticket_id,
                                  appointment_type,
                                  description,
                                  appt_start_iso_8601,
                                  appt_end_iso_8601,
                                  status,
                                  tech_id
                                FROM appointments`;
  con.query(appointmentQueryString,function(err,appt_rows){
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
      appointment.title = appt_rows[i].title;
      appointment.ticketId = appt_rows[i].ticket_id;
      appointment.appointmentType = appt_rows[i].appointment_type;
      appointment.description = appt_rows[i].description;
      appointment.start = appt_rows[i].appt_start_iso_8601;
      appointment.end = appt_rows[i].appt_end_iso_8601;
      appointment.status = appt_rows[i].status;  // (0, 1 or 2)
      // ************************ comment out for testing events without resources
      // appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
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
                                  title,
                                  ticket_id,
                                  appointment_type,
                                  description,
                                  appt_start_iso_8601,
                                  appt_end_iso_8601,
                                  status,
                                  tech_id
                                FROM appointments
                                WHERE appointment_id = ?`;
  con.query(appointmentQueryString, [key], function(err,appt_rows){
    if(err) throw err;
    console.log('\nAppointment ' + appointment_id + ':\n');
    console.log('appt_rows:\n' + appt_rows);

    var response = new Object();
    var appointments = [];
    var this_appt = appt_rows[0];
    eventSources = [];

    var appointment = new Object();
    appointment.id = this_appt.appointment_id;
    appointment.title = this_appt.title;
    appointment.ticketId = this_appt.ticket_id;
    appointment.appointmentType = this_appt.appointment_type;
    appointment.description = this_appt.description;
    appointment.start = this_appt.appt_start_iso_8601;
    appointment.end = this_appt.appt_end_iso_8601;
    appointment.status = this_appt.status;  // (0, 1 or 2)
    // ************************ comment out for testing events without resources
    // appointment.resourceId = this_appt.tech_id;  // (user_id in technician_schedules)
    appointments.push(appointment);
    eventSources.push(appointments);
    response.eventSources = eventSources;
    res.json(response);
  });
});



// GET all time_off events
router.get('/api/time_off', function(req,res){
  var con = db.connectToScheduleDB();
  var timeOffQueryString = `SELECT time_off_id,
                              tech_id,
                              toff_start_iso_8601,
                              toff_end_iso_8601,
                              notes
                            FROM time_off`;
  con.query(timeOffQueryString,function(err,toff_rows){
    if(err) throw err;
    console.log('\nAll timeOffEvents:\n');
    console.log('toff_rows:\n' + toff_rows);
    var response = new Object();
    var timeOffEvents = [];
    eventSources = [];

    // iterate over toff_rows into a valid JSON string
    for (var i = 0; i < toff_rows.length; i++) {
      console.log('toff_rows ' + i + ':\n' + toff_rows[i]);
      var timeOffEvent = new Object();
      timeOffEvent.id = toff_rows[i].time_off_id;
      timeOffEvent.title = 'Tech ' + toff_rows[i].tech_id + ' Off';
      timeOffEvent.start = toff_rows[i].toff_start_iso_8601;
      timeOffEvent.end = toff_rows[i].toff_end_iso_8601;
      timeOffEvent.notes = toff_rows[i].notes;
      // ************************ comment out for testing events without resources
      // timeOffEvent.resourceId = toff_rows[i].tech_id;  // (user_id in technician_schedules)
      timeOffEvents.push(timeOffEvent);
    }
    eventSources.push(timeOffEvents);
    response.eventSources = eventSources;
    res.json(response);
  });
});



// GET a time_off event by time_off_id
router.get('/api/time_off/:time_off_id', function(req,res){
  var con = db.connectToScheduleDB();
  var time_off_id = req.param('time_off_id');
  var key = time_off_id;
  var timeOffQueryString = `SELECT time_off_id,
                              tech_id,
                              toff_start_iso_8601,
                              toff_end_iso_8601,
                              notes
                            FROM time_off
                            WHERE time_off_id = ?`;
  con.query(timeOffQueryString, [key], function(err,toff_rows){
    if(err) throw err;
    console.log('\ntimeOffEvent with time_off_id = ' + time_off_id + ':\n');
    console.log('toff_rows:\n' + toff_rows);

    var response = new Object();
    var timeOffEvents = [];
    var this_toff = toff_rows[0];
    eventSources = [];

    var timeOffEvent = new Object();
    timeOffEvent.id = this_toff.time_off_id;
    timeOffEvent.title = 'Tech ' + this_toff.tech_id + ' Off';
    timeOffEvent.start = this_toff.toff_start_iso_8601;
    timeOffEvent.end = this_toff.toff_end_iso_8601;
    timeOffEvent.notes = this_toff.notes;
    // ************************ comment out for testing events without resources
    // timeOffEvent.resourceId = this_toff.tech_id;  // (user_id in technician_schedules)
    timeOffEvents.push(timeOffEvent);
    eventSources.push(timeOffEvents);
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



// GET all the resources and events - technician working hours + appointments + time off events
router.get('/api/resources_and_events', function(req,res){
  var con = db.connectToScheduleDB();
  var response = new Object();
  // using eventSources array to combine appointments and time_off events
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
                                    title,
                                    ticket_id,
                                    appointment_type,
                                    description,
                                    appt_start_iso_8601,
                                    appt_end_iso_8601,
                                    status,
                                    tech_id
                                  FROM appointments`;
    con.query(appointmentQueryString,function(err,appt_rows){
      if(err) throw err;
      var appointments = [];
      for (var i = 0; i < appt_rows.length; i++) {
        // console.log('appt_rows ' + i + ':\n' + appt_rows[i]);
        // console.log('appt_rows ' + i + ' ticket_id:\n' + appt_rows[i].ticket_id);
        var appointment = new Object();
        appointment.id = appt_rows[i].appointment_id;
        appointment.title = appt_rows[i].title;
        appointment.ticketId = appt_rows[i].ticket_id;
        appointment.appointmentType = appt_rows[i].appointment_type;
        appointment.description = appt_rows[i].description;
        appointment.start = appt_rows[i].appt_start_iso_8601;
        appointment.end = appt_rows[i].appt_end_iso_8601;
        appointment.status = appt_rows[i].status;  // (0, 1 or 2)
        // ************************ comment out for testing events without resources
        appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
        appointments.push(appointment);
        // console.log(appointment);
      }
      eventSources.push(appointments);
      // response.eventSources = eventSources;

      // get all time off events
      var timeOffQueryString = `SELECT time_off_id,
                                  tech_id,
                                  toff_start_iso_8601,
                                  toff_end_iso_8601,
                                  notes
                                FROM time_off`;
      con.query(timeOffQueryString,function(err,toff_rows){
        if(err) throw err;
        // console.log('\nAll timeOffEvents:\n');
        // console.log('toff_rows:\n' + toff_rows);
        var timeOffEvents = [];
        // iterate over toff_rows into a valid JSON string
        for (var i = 0; i < toff_rows.length; i++) {
          // console.log('toff_rows ' + i + ':\n' + toff_rows[i]);
          var timeOffEvent = new Object();
          timeOffEvent.id = toff_rows[i].time_off_id;
          timeOffEvent.title = 'Tech ' + toff_rows[i].tech_id + ' Off';
          timeOffEvent.start = toff_rows[i].toff_start_iso_8601;
          timeOffEvent.end = toff_rows[i].toff_end_iso_8601;
          timeOffEvent.notes = toff_rows[i].notes;
          // ************************ comment out for testing events without resources
          timeOffEvent.resourceId = toff_rows[i].tech_id;  // (user_id in technician_schedules)
          timeOffEvents.push(timeOffEvent);
        }
        eventSources.push(timeOffEvents);
        response.eventSources = eventSources;

        console.log('response: ' + JSON.stringify(response));
        res.json(response);
      }); // closes 'con.query(timeOffQueryString,function(err,toff_rows)'
    }); // closes 'con.query(appointmentQueryString,function(err,appt_rows)'
  }); // closes 'con.query(tsQueryString,function(err,ts_rows)'
}); // closes 'router.get('/api/resources_and_events', function(req,res)'



// GET one resource and all its events - technician working hours + appointments + time off events
router.get('/api/resources_and_events/:user_id', function(req,res){
  var con = db.connectToScheduleDB();
  var user_id = req.param('user_id');
  var key = user_id;
  console.log('inside GET request for one resource and all its events - /api/resources_and_events/' + user_id);
  var response = new Object();
  // using eventSources array to combine appointments and time_off events
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
                                    title,
                                    ticket_id,
                                    appointment_type,
                                    description,
                                    appt_start_iso_8601,
                                    appt_end_iso_8601,
                                    status,
                                    tech_id
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
        appointment.title = appt_rows[i].title;
        appointment.ticketId = appt_rows[i].ticket_id;
        appointment.appointmentType = appt_rows[i].appointment_type;
        appointment.description = appt_rows[i].description;
        appointment.start = appt_rows[i].appt_start_iso_8601;
        appointment.end = appt_rows[i].appt_end_iso_8601;
        appointment.status = appt_rows[i].status;  // (0, 1 or 2)
        // ************************ comment out for testing events without resources
        appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
        appointments.push(appointment);
        // console.log(appointment);
      }
      eventSources.push(appointments);
      // response.eventSources = eventSources;

      // get all time off events
      var timeOffQueryString = `SELECT time_off_id,
                                  tech_id,
                                  toff_start_iso_8601,
                                  toff_end_iso_8601,
                                  notes
                                FROM time_off
                                WHERE tech_id = ?`;
      con.query(timeOffQueryString, [key], function(err,toff_rows){
        if(err) throw err;
        // console.log('\nAll timeOffEvents:\n');
        // console.log('toff_rows:\n' + toff_rows);
        var timeOffEvents = [];
        // iterate over toff_rows into a valid JSON string
        for (var i = 0; i < toff_rows.length; i++) {
          // console.log('toff_rows ' + i + ':\n' + toff_rows[i]);
          var timeOffEvent = new Object();
          timeOffEvent.id = toff_rows[i].time_off_id;
          timeOffEvent.title = 'Tech ' + toff_rows[i].tech_id + ' Off';
          timeOffEvent.start = toff_rows[i].toff_start_iso_8601;
          timeOffEvent.end = toff_rows[i].toff_end_iso_8601;
          timeOffEvent.notes = toff_rows[i].notes;
          // ************************ comment out for testing events without resources
          timeOffEvent.resourceId = toff_rows[i].tech_id;  // (user_id in technician_schedules)
          timeOffEvents.push(timeOffEvent);
        }
        eventSources.push(timeOffEvents);
        response.eventSources = eventSources;

        console.log('response: ' + JSON.stringify(response));
        res.json(response);
      }); // closes 'con.query(timeOffQueryString,function(err,toff_rows)'
    }); // closes 'con.query(appointmentQueryString,function(err,appt_rows)'
  }); // closes 'con.query(tsQueryString,function(err,ts_rows)'
}); // closes 'router.get('/api/resources_and_events', function(req,res)'




router.use(bodyParser.json());
// parses data from form into JSON, so then you access e.g. 'name' field from form
// as req.body.name ... if you want all the data from the form, you access it as
// req.body
router.use(bodyParser.urlencoded({ extended: false }));
// parses urlencoded bodies



// receive a form post for an appointment and save it to the database
router.post('/api/appointments', function (req, res) {
  var appointment = [
    req.body.customer_id,
    req.body.tech_id,
    req.body.ticket_id,
    req.body.appt_date,
    req.body.appt_start_time,
    req.body.appt_end_time,
    req.body.appt_date + 'T' + req.body.appt_start_time, // start_time in ISO8601
    req.body.appt_date + 'T' + req.body.appt_end_time, // end_time in ISO8601
    req.body.title,
    req.body.appointment_type,
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
  // TODO: create validation for customer_id - positive integer, matching an existing customer_id (TODO: make customers table)
  // TODO: create validation for tech_id - must match an existing tech_id (= user_id in users table)
  // TODO: decide if ticket_id is actually a required field (it's not required in the db)
  // else if ( isPositiveInt(req.body.ticket_id) == false ) {
  //   console.log('ticket_id is invalid: it is not a positive integer');
  // }
  else if ( moment(req.body.appt_date, 'YYYY-MM-DD', true).isValid() == false ) {
    console.log('appt_date is invalid: it is not of the form YYYY-MM-DD');
  }
  else if ( moment(req.body.appt_start_time, 'HH:mm:ss', true).isValid() == false ) {
    console.log('appt_start_time is invalid: it is not of the form HH:mm:ss');
  }
  else if ( moment(req.body.appt_end_time, 'HH:mm:ss', true).isValid() == false ) {
    console.log('appt_end_time is invalid: it is not of the form HH:mm:ss');
  }
  // TODO: create validation for appointment_type - there should be a few set appointment types to choose from
  // TODO: improve validation for status - there should only be a few set statuses to choose from
  else if ( isInt(req.body.status) == false ) {
    console.log('appointment status is invalid: it is not a positive integer');
  }

  // if appointment_id is valid, appointment with that id is updated in the db
  else if (isPositiveInt(req.body.appointment_id)) {
    var con = db.connectToScheduleDB();
    var appointmentQueryString = `UPDATE appointments
                                  SET customer_id = ?,
                                    tech_id = ?,
                                    ticket_id = ?,
                                    appt_date = ?,
                                    appt_start_time = ?,
                                    appt_end_time = ?,
                                    appt_start_iso_8601 = ?,
                                    appt_end_iso_8601 = ?,
                                    title = ?,
                                    appointment_type = ?,
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
                                   (customer_id,
                                    tech_id,
                                    ticket_id,
                                    appt_date,
                                    appt_start_time,
                                    appt_end_time,
                                    appt_start_iso_8601,
                                    appt_end_iso_8601,
                                    title,
                                    appointment_type,
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


// on a click, calls api with a DELETE request that includes the ID (index) of the object to delete
// this one is for a appointment, specified by appointment_id
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



// receive a form post for a time_off event and save it to the database
router.post('/api/time_off', function (req, res) {
  var time_off_item = [
    req.body.tech_id,
    req.body.toff_date,
    req.body.toff_start_time,
    req.body.toff_end_time,
    req.body.toff_date + 'T' + req.body.toff_start_time, // start_time in ISO8601
    req.body.toff_date + 'T' + req.body.toff_end_time, // end_time in ISO8601
    req.body.notes,
    req.body.time_off_id
  ];

  for (i = 0; i < time_off_item.length; i++) {
    console.log(time_off_item[i]);
  }


  // var timeOffEvent = new Object();
  // timeOffEvent.time_off_id = req.body.time_off_id;
  // timeOffEvent.tech_id = req.body.tech_id;
  // timeOffEvent.toff_date = req.body.toff_date;
  // timeOffEvent.toff_start_time = req.body.toff_start_time;
  // timeOffEvent.toff_end_time = req.body.toff_end_time;
  // timeOffEvent.toff_start_iso_8601 = req.body.toff_date + 'T' + req.body.toff_start_time;
  // timeOffEvent.toff_end_iso_8601 = req.body.toff_date + 'T' + req.body.toff_end_time;
  // timeOffEvent.notes = req.body.notes;

  // console.log(timeOffEvent.time_off_id);
  // console.log(timeOffEvent.tech_id);
  // console.log(timeOffEvent.toff_date);
  // console.log(timeOffEvent.toff_start_time);
  // console.log(timeOffEvent.toff_end_time);
  // console.log(timeOffEvent.toff_start_iso_8601);
  // console.log(timeOffEvent.toff_end_iso_8601);
  // console.log(timeOffEvent.notes);


  /*
    WRITING VALIDATIONS
    what are the things you need to check in order for this to insert/update properly?
    time_off_id - must be either blank (=new time off event), OR a positive integer
    tech_id - must be a positive integer
    toff_date - must be a date of the form YYYY-MM-DD (could put some upper and lower bounds on the dates), or empty
    toff_start_time - must be a time of the form HH:MM:SS, in 24-hour time, with no seconds (or we'll ignore seconds), or empty
    toff_end_time - must be a time of the form HH:MM:SS, in 24-hour time, with no seconds (or we'll ignore seconds), or empty
    toff_start_iso_8601 - generated from toff_date and toff_start_time, in the form YYYY-MM-DDTHH:MM:SS
    toff_end_iso_8601 - generated from toff_date and toff_end_time, in the form YYYY-MM-DDTHH:MM:SS
    notes - anything, including empty.

    See Josh's email about validations & validation middleware
  */


  if ( (req.body.time_off_id != '') && isPositiveInt(req.body.time_off_id) == false ) {
    console.log('time_off_id is invalid: it is neither a positive integer nor an empty string');
  }
  else if ( moment(req.body.toff_date, 'YYYY-MM-DD', true).isValid() == false ) {
    console.log('toff_date is invalid: it is not of the form YYYY-MM-DD');
  }
  else if ( moment(req.body.toff_start_time, 'HH:mm:ss', true).isValid() == false ) {
    console.log('toff_start_time is invalid: it is not of the form HH:mm:ss');
  }
  else if ( moment(req.body.toff_end_time, 'HH:mm:ss', true).isValid() == false ) {
    console.log('toff_end_time is invalid: it is not of the form HH:mm:ss');
  }

  // if time_off_id is valid, time_off event with that id is updated in the db
  else if (isPositiveInt(req.body.time_off_id)) {
  // if (req.body.time_off_id > 0) {
    var con = db.connectToScheduleDB();
    var timeOffQueryString = `UPDATE time_off
                              SET tech_id = ?,
                                toff_date = ?,
                                toff_start_time = ?,
                                toff_end_time = ?,
                                toff_start_iso_8601 = ?,
                                toff_end_iso_8601 = ?,
                                notes = ?
                              WHERE time_off_id = ?;`;
    // var timeOffQueryString = `UPDATE time_off
    //                           SET tech_id = ` + con.escape(timeOffEvent.tech_id) + `,
    //                             toff_date = ` + con.escape(timeOffEvent.toff_date) + `,
    //                             toff_start_time = ` + con.escape(timeOffEvent.toff_start_time) + `,
    //                             toff_end_time = ` + con.escape(timeOffEvent.toff_end_time) + `,
    //                             toff_start_iso_8601 = ` + con.escape(timeOffEvent.toff_start_iso_8601) + `,
    //                             toff_end_iso_8601 = ` + con.escape(timeOffEvent.toff_end_iso_8601) + `,
    //                             notes = ` + con.escape(timeOffEvent.notes) + `
    //                           WHERE time_off_id = ` + con.escape(timeOffEvent.time_off_id) + `;`;

    con.query(timeOffQueryString, time_off_item, function(err, result){
      // con.query(timeOffQueryString, function(err, result){
      if(err) throw err;
      else {
        console.log('timeOffQueryString sent to db as update to existing item');
        console.log('affected rows: ' + result.affectedRows);
        res.json("success"); // response says whether save was success or failure - TODO: make this a useful response message
      }
    });
  }
  // if no time_off_id is given, a new time_off event is created in the db
  // *** TODO: check if new event is in the past, and write a warning that requires an OK to continue creating it
  else if (req.body.time_off_id == '') {
    var con = db.connectToScheduleDB();
    var timeOffQueryString = `INSERT INTO time_off
                                (tech_id, toff_date, toff_start_time, toff_end_time, toff_start_iso_8601, toff_end_iso_8601, notes)
                              VALUES
                                (?, ?, ?, ?, ?, ?, ?);`;
    // var timeOffQueryString = `INSERT INTO time_off
    //                             (tech_id, toff_date, toff_start_time, toff_end_time, toff_start_iso_8601, toff_end_iso_8601, notes)
    //                           VALUES
    //                            (`con.escape(timeOffEvent.tech_id) + `,` +
    //                              con.escape(timeOffEvent.toff_date) + `,` +
    //                              con.escape(timeOffEvent.toff_start_time) + `,` +
    //                              con.escape(timeOffEvent.toff_end_time) + `,` +
    //                              con.escape(timeOffEvent.toff_start_iso_8601) + `,` +
    //                              con.escape(timeOffEvent.toff_end_iso_8601) + `,` +
    //                              con.escape(timeOffEvent.notes) + `);`;

    con.query(timeOffQueryString, time_off_item, function(err, result){
    // con.query(timeOffQueryString, function(err, result){
      if(err) throw err;
      else {
        console.log('timeOffQueryString sent to db as new item. time_off_id = ' + result.insertId);
        console.log('affected rows: ' + result.affectedRows);
        res.json("success"); // response says whether save was success or failure - TODO: make this a useful response message
      }
    });
  }
});



// on a click, calls api with a DELETE request that includes the ID (index) of the object to delete
// this one is for a time_off event, specified by time_off_id
router.delete('/api/time_off/:id', function(req, res) {
  var con = db.connectToScheduleDB();
  // var time_off_id = req.param('time_off_id');
  var time_off_id = 8; // **** TODO: GET THIS WORKING PROPERLY
  var key = time_off_id;

  if (isPositiveInt(time_off_id) == false) {
    console.log('time_off_id is invalid: it is not a positive integer');
  }
  var timeOffQueryString = `DELETE FROM time_off
                            WHERE time_off_id = ?`;
  con.query(timeOffQueryString, [key], function(err, result){
    if(err) throw err;
    else {
      console.log('deleting time_off row with time_off_id ' + time_off_id);
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

module.exports = router;
