var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
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
      // timeOffEvent.resourceID = toff_rows[i].tech_id;  // (user_id in technician_schedules)
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
    // timeOffEvent.resourceID = this_toff.tech_id;  // (user_id in technician_schedules)
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



    // *** dummy appointments & timeOffEvents for debugging *****************************
    // *** comment/uncomment this whole section when switching back & forth *************

    // var appointments = [{
    //   id: 1, // appointment_id
    //   title: 'Full Install', // title
    //   ticketId: 101, // ticket_id
    //   appointmentType: 'Install', // appointment_type
    //   description: 'Install wifi chez Joe Blow', // description
    //   start: todayDate + 'T10:00:00', // appt_start_iso_8601
    //   end: todayDate + 'T12:00:00', // appt_end_iso_8601
    //   status: 0, // status   (0, 1 or 2)
    //   resourceId: 1, // tech_id (user_id in technician_schedules)
    // }];
    // eventSources.push(appointments);

    // var timeOffEvents = [{
    //   id: 1, // time_off_id,
    //   title: 'Tech 2 Off', // maybe put tech name in here later, e.g. "Ben Off"
    //   start: todayDate + 'T12:30:00', // toff_start_iso_8601,
    //   end: todayDate + 'T13:30:00', // toff_end_iso_8601,
    //   notes: 'doctor appointment',
    //   resourceId: 2, // tech_id (user_id in technician_schedules)
    // }];
    // eventSources.push(timeOffEvents);

    // response.eventSources = eventSources;
    // res.json(response);

    // *** end of dummy appointments and timeOffEvents for debugging ********************
    // *** comment/uncomment this whole section when switching back & forth *************




    // *** trying rearranging the code - put appointments inside time_off ***************
    // *** comment/uncomment this whole section when switching back & forth *************

    // get all time off events
    var timeOffQueryString = `SELECT time_off_id,
                                tech_id,
                                toff_start_iso_8601,
                                toff_end_iso_8601,
                                notes
                              FROM time_off`;
    con.query(timeOffQueryString,function(err,toff_rows){
      if(err) throw err;
      var timeOffEvents = [];
      for (var i = 0; i < toff_rows.length; i++) {
        // console.log('toff_rows ' + i + ':\n' + toff_rows[i]);
        var timeOffEvent = new Object();
        timeOffEvent.id = toff_rows[i].time_off_id;
        timeOffEvent.title = 'Tech ' + toff_rows[i].tech_id + ' Off';
        timeOffEvent.start = toff_rows[i].toff_start_iso_8601;
        timeOffEvent.end = toff_rows[i].toff_end_iso_8601;
        timeOffEvent.notes = toff_rows[i].notes;
        // ************************ comment out for testing events without resources
        timeOffEvent.resourceID = toff_rows[i].tech_id;  // (user_id in technician_schedules)
        timeOffEvents.push(timeOffEvent);
      }
      eventSources.push(timeOffEvents);
      // response.eventSources = eventSources;

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
        response.eventSources = eventSources;

        console.log('response: ' + JSON.stringify(response));
        res.json(response);
      }); // closes 'con.query(appointmentQueryString,function(err,appt_rows)'
    }); // closes 'con.query(timeOffQueryString,function(err,toff_rows)'

    // *** this is the end of where I'm trying rearranging the code *********************
    // *** comment/uncomment this whole section when switching back & forth *************




    // *** this is the real code that I'm trying to fix *********************************
    // *** comment/uncomment this whole section when switching back & forth *************

    // // get all appointments
    // var appointmentQueryString = `SELECT appointment_id,
    //                                 title,
    //                                 ticket_id,
    //                                 appointment_type,
    //                                 description,
    //                                 appt_start_iso_8601,
    //                                 appt_end_iso_8601,
    //                                 status,
    //                                 tech_id
    //                               FROM appointments`;
    // con.query(appointmentQueryString,function(err,appt_rows){
    //   if(err) throw err;
    //   var appointments = [];
    //   for (var i = 0; i < appt_rows.length; i++) {
    //     // console.log('appt_rows ' + i + ':\n' + appt_rows[i]);
    //     // console.log('appt_rows ' + i + ' ticket_id:\n' + appt_rows[i].ticket_id);
    //     var appointment = new Object();
    //     appointment.id = appt_rows[i].appointment_id;
    //     appointment.title = appt_rows[i].title;
    //     appointment.ticketId = appt_rows[i].ticket_id;
    //     appointment.appointmentType = appt_rows[i].appointment_type;
    //     appointment.description = appt_rows[i].description;
    //     appointment.start = appt_rows[i].appt_start_iso_8601;
    //     appointment.end = appt_rows[i].appt_end_iso_8601;
    //     appointment.status = appt_rows[i].status;  // (0, 1 or 2)
    //     // ************************ comment out for testing events without resources
    //     appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
    //     appointments.push(appointment);
    //     // console.log(appointment);
    //   }
    //   eventSources.push(appointments);
    //   // response.eventSources = eventSources;

    //   // get all time off events
    //   var timeOffQueryString = `SELECT time_off_id,
    //                               tech_id,
    //                               toff_start_iso_8601,
    //                               toff_end_iso_8601,
    //                               notes
    //                             FROM time_off`;
    //   con.query(timeOffQueryString,function(err,toff_rows){
    //     if(err) throw err;
    //     console.log('\nAll timeOffEvents:\n');
    //     console.log('toff_rows:\n' + toff_rows);
    //     var timeOffEvents = [];
    //     // iterate over toff_rows into a valid JSON string
    //     for (var i = 0; i < toff_rows.length; i++) {
    //       console.log('toff_rows ' + i + ':\n' + toff_rows[i]);
    //       var timeOffEvent = new Object();
    //       timeOffEvent.id = toff_rows[i].time_off_id;
    //       timeOffEvent.title = 'Tech ' + toff_rows[i].tech_id + ' Off';
    //       timeOffEvent.start = toff_rows[i].toff_start_iso_8601;
    //       timeOffEvent.end = toff_rows[i].toff_end_iso_8601;
    //       timeOffEvent.notes = toff_rows[i].notes;
    //       // ************************ comment out for testing events without resources
    //       timeOffEvent.resourceID = toff_rows[i].tech_id;  // (user_id in technician_schedules)
    //       timeOffEvents.push(timeOffEvent);
    //     }
    //     eventSources.push(timeOffEvents);
    //     response.eventSources = eventSources;

    //     console.log('response: ' + JSON.stringify(response));
    //     res.json(response);
    //   }); // closes 'con.query(timeOffQueryString,function(err,toff_rows)'
    // }); // closes 'con.query(appointmentQueryString,function(err,appt_rows)'

    // *** this is the end of the code that I'm trying to fix ***************************
    // *** comment/uncomment this whole section when switching back & forth *************



  }); // closes 'con.query(tsQueryString,function(err,ts_rows)'
}); // closes 'router.get('/api/resources_and_events', function(req,res)'



// receive a form post and save it to the sample file (later we want this to save to the db)
router.post('/api',function(req,res){
  sampleData.unshift(req.body);
  fs.writeFile('app/data/sample.json', JSON.stringify(sampleData),'utf8',function(err){
    if(err){
      console.log(err);
    }
  });
  res.json(sampleData);
});

// on a click, calls api with a DELETE request that includes the ID (index) of the object to delete
router.delete('/api/:id', function(req,res) {
  sampleData.splice(req.params.id,1);
  fs.writeFile('app/data/sample.json', JSON.stringify(sampleData),'utf8',function(err){
    if(err){
      console.log(err);
    }
  });
  res.json(sampleData);
});

module.exports = router;
