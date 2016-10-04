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
  // *** get the data as is from the db
  var queryString =  `SELECT t1.schedule_id, t1.user_id, t1.user_name,
                        sunday_start,
                        sunday_end,
                        monday_start,
                        monday_end,
                        tuesday_start,
                        tuesday_end,
                        wednesday_start,
                        wednesday_end,
                        thursday_start,
                        thursday_end,
                        friday_start,
                        friday_end,
                        saturday_start,
                        saturday_end
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
      resource.title =ts_rows[i].user_name;

      /*** DIRTY HACK to get around null resource days showing up as available all day instead of not available all day
       - this might make people look like they're in on their days off in Month view!!! ***/
      if (ts_rows[i].sunday_start) {
        resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end}; }
      else { resource.businessHours[0] = {dow:[0], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].monday_start) { resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end}; }
      else { resource.businessHours[1] = {dow:[1], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].tuesday_start) { resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end}; }
      else { resource.businessHours[2] = {dow:[2], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].wednesday_start) { resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end}; }
      else { resource.businessHours[3] = {dow:[3], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].thursday_start) { resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end}; }
      else { resource.businessHours[4] = {dow:[4], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].friday_start) { resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end}; }
      else { resource.businessHours[5] = {dow:[5], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].saturday_start) { resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end}; }
      else { resource.businessHours[6] = {dow:[6], start:'00:00:00', end:'00:00:01'}; }

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
                        sunday_start,
                        sunday_end,
                        monday_start,
                        monday_end,
                        tuesday_start,
                        tuesday_end,
                        wednesday_start,
                        wednesday_end,
                        thursday_start,
                        thursday_end,
                        friday_start,
                        friday_end,
                        saturday_start,
                        saturday_end
                    FROM technician_schedules t1
                    WHERE t1.user_id = ?
                    AND t1.created_at = (
                      SELECT MAX(t2.created_at)
                      FROM technician_schedules t2
                      WHERE t2.user_id = t1.user_id)`;
  var con = db.connectToScheduleDB();
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

    /*** DIRTY HACK to get around null resource days showing up as available all day instead of not available all day
     - this might make people look like they're in on their days off in Month view!!! ***/
    if (this_tech.sunday_start) {
      resource.businessHours[0] = {dow:[0], start:this_tech.sunday_start, end:this_tech.sunday_end}; }
    else { resource.businessHours[0] = {dow:[0], start:'00:00:00', end:'00:00:01'}; }
    if (this_tech.monday_start) { resource.businessHours[1] = {dow:[1], start:this_tech.monday_start, end:this_tech.monday_end}; }
    else { resource.businessHours[1] = {dow:[1], start:'00:00:00', end:'00:00:01'}; }
    if (this_tech.tuesday_start) { resource.businessHours[2] = {dow:[2], start:this_tech.tuesday_start, end:this_tech.tuesday_end}; }
    else { resource.businessHours[2] = {dow:[2], start:'00:00:00', end:'00:00:01'}; }
    if (this_tech.wednesday_start) { resource.businessHours[3] = {dow:[3], start:this_tech.wednesday_start, end:this_tech.wednesday_end}; }
    else { resource.businessHours[3] = {dow:[3], start:'00:00:00', end:'00:00:01'}; }
    if (this_tech.thursday_start) { resource.businessHours[4] = {dow:[4], start:this_tech.thursday_start, end:this_tech.thursday_end}; }
    else { resource.businessHours[4] = {dow:[4], start:'00:00:00', end:'00:00:01'}; }
    if (this_tech.friday_start) { resource.businessHours[5] = {dow:[5], start:this_tech.friday_start, end:this_tech.friday_end}; }
    else { resource.businessHours[5] = {dow:[5], start:'00:00:00', end:'00:00:01'}; }
    if (this_tech.saturday_start) { resource.businessHours[6] = {dow:[6], start:this_tech.saturday_start, end:this_tech.saturday_end}; }
    else { resource.businessHours[6] = {dow:[6], start:'00:00:00', end:'00:00:01'}; }

    resources.push(resource);


    // // iterate over ts_rows into a valid JSON string
    // for (var i = 0; i < ts_rows.length; i++) {
    //   console.log('ts_rows ' + i + ':\n' + ts_rows[i]);
    //   console.log('ts_rows ' + i + ' user_id:\n' + ts_rows[i].user_id);
    //   // one resource is one tech's working hours
    //   var resource = new Object();
    //   resource.businessHours = [];
    //   resource.id = ts_rows[i].user_id;
    //   resource.title =ts_rows[i].user_name;

    //   /*** DIRTY HACK to get around null resource days showing up as available all day instead of not available all day
    //    - this might make people look like they're in on their days off in Month view!!! ***/
    //   if (ts_rows[i].sunday_start) {
    //     resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end}; }
    //   else { resource.businessHours[0] = {dow:[0], start:'00:00:00', end:'00:00:01'}; }
    //   if (ts_rows[i].monday_start) { resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end}; }
    //   else { resource.businessHours[1] = {dow:[1], start:'00:00:00', end:'00:00:01'}; }
    //   if (ts_rows[i].tuesday_start) { resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end}; }
    //   else { resource.businessHours[2] = {dow:[2], start:'00:00:00', end:'00:00:01'}; }
    //   if (ts_rows[i].wednesday_start) { resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end}; }
    //   else { resource.businessHours[3] = {dow:[3], start:'00:00:00', end:'00:00:01'}; }
    //   if (ts_rows[i].thursday_start) { resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end}; }
    //   else { resource.businessHours[4] = {dow:[4], start:'00:00:00', end:'00:00:01'}; }
    //   if (ts_rows[i].friday_start) { resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end}; }
    //   else { resource.businessHours[5] = {dow:[5], start:'00:00:00', end:'00:00:01'}; }
    //   if (ts_rows[i].saturday_start) { resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end}; }
    //   else { resource.businessHours[6] = {dow:[6], start:'00:00:00', end:'00:00:01'}; }

    //   resources.push(resource);
    // }
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
      // timeOffEvent.resourceID = toff_rows[i].tech_id;
      timeOffEvents.push(timeOffEvent);
    }
    eventSources.push(timeOffEvents);
    response.eventSources = eventSources;
    res.json(response);
  });
});



// ******* This is broken - review learnyounode project where you chain output from several streams and then output the response
// GET all the resources and events - technician working hours + appointments + time off events
router.get('/api/resources_and_events', function(req,res){
// *** copied the guts of getAllTechnicianSchedules into this api get request
var con = db.connectToScheduleDB();
var queryString =  `SELECT t1.schedule_id, t1.user_id, t1.user_name,
                      sunday_start,
                      sunday_end,
                      monday_start,
                      monday_end,
                      tuesday_start,
                      tuesday_end,
                      wednesday_start,
                      wednesday_end,
                      thursday_start,
                      thursday_end,
                      friday_start,
                      friday_end,
                      saturday_start,
                      saturday_end
                  FROM technician_schedules t1
                  WHERE t1.created_at = (
                    SELECT MAX(t2.created_at)
                    FROM technician_schedules t2
                    WHERE t2.user_id = t1.user_id)`;
  con.query(queryString,function(err,ts_rows) { // *** PROBLEM: right now this '{' doesn't close until line 171, just below 'res.json(response);'
    if(err) throw err;
    console.log('\nAll current technician schedules:\n');
    console.log('ts_rows:\n' + ts_rows);
    var response = new Object();
    var resources = [];
    eventSources = [];

    // iterate over ts_rows and make it into a valid JSON string
    for (var i = 0; i < ts_rows.length; i++) {
      console.log('ts_rows ' + i + ':\n' + ts_rows[i]);
      console.log('ts_rows ' + i + ' user_id:\n' + ts_rows[i].user_id);
      var resource = new Object();
      resource.businessHours = [];
      resource.id = ts_rows[i].user_id;
      resource.title = ts_rows[i].user_name;
    //   resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end};
    //   resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end};
    //   resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end};
    //   resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end};
    //   resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end};
    //   resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end};
    //   resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end};

      /*** DIRTY HACK to get around null resource days showing up as available all day instead of not available all day
       - this might make people look like they're in on their days off in Month view!!! ***/
      if (ts_rows[i].sunday_start) { resource.businessHours[0] = {dow:[0], start:ts_rows[i].sunday_start, end:ts_rows[i].sunday_end}; }
      else { resource.businessHours[0] = {dow:[0], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].monday_start) { resource.businessHours[1] = {dow:[1], start:ts_rows[i].monday_start, end:ts_rows[i].monday_end}; }
      else { resource.businessHours[1] = {dow:[1], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].tuesday_start) { resource.businessHours[2] = {dow:[2], start:ts_rows[i].tuesday_start, end:ts_rows[i].tuesday_end}; }
      else { resource.businessHours[2] = {dow:[2], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].wednesday_start) { resource.businessHours[3] = {dow:[3], start:ts_rows[i].wednesday_start, end:ts_rows[i].wednesday_end}; }
      else { resource.businessHours[3] = {dow:[3], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].thursday_start) { resource.businessHours[4] = {dow:[4], start:ts_rows[i].thursday_start, end:ts_rows[i].thursday_end}; }
      else { resource.businessHours[4] = {dow:[4], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].friday_start) { resource.businessHours[5] = {dow:[5], start:ts_rows[i].friday_start, end:ts_rows[i].friday_end}; }
      else { resource.businessHours[5] = {dow:[5], start:'00:00:00', end:'00:00:01'}; }
      if (ts_rows[i].saturday_start) { resource.businessHours[6] = {dow:[6], start:ts_rows[i].saturday_start, end:ts_rows[i].saturday_end}; }
      else { resource.businessHours[6] = {dow:[6], start:'00:00:00', end:'00:00:01'}; }

      resources.push(resource);
    }
    response.resources = resources;


    // using eventSources array to combine appointments and time_off events
    var eventSources = [];

    var appointments = [{
      id: 1, // appointment_id
      title: 'Full Install', // title
      ticketId: '101', // ticket_id
      appointmentType: 'Install', // appointment_type
      description: 'Install wifi chez Joe Blow', // description
      start: todayDate + 'T10:00:00', // appt_start_iso_8601
      end: todayDate + 'T12:00:00', // appt_end_iso_8601
      status: '0', // status   (0, 1 or 2)
      resourceId: '1', // tech_id (user_id in technician_schedules)
    }];

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
    // if(err) throw err;
    // console.log('\nAll appointments:\n');
    // console.log('appt_rows:\n' + appt_rows);

    // var appointments = [];
    // for (var i = 0; i < appt_rows.length; i++) {
    //   console.log('appt_rows ' + i + ':\n' + appt_rows[i]);
    //   console.log('appt_rows ' + i + ' ticket_id:\n' + appt_rows[i].ticket_id);
    //   var appointment = new Object();
    //   appointment.id = appt_rows[i].appointment_id;
    //   appointment.title = appt_rows[i].title;
    //   appointment.ticketId = appt_rows[i].ticket_id;
    //   appointment.appointmentType = appt_rows[i].appointment_type;
    //   appointment.description = appt_rows[i].description;
    //   appointment.start = appt_rows[i].appt_start_iso_8601;
    //   appointment.end = appt_rows[i].appt_end_iso_8601;
    //   appointment.status = appt_rows[i].status;  // (0, 1 or 2)
    //   appointment.resourceId = appt_rows[i].tech_id;  // (user_id in technician_schedules)
    //   appointments.push(appointment);
    // }
    eventSources.push(appointments);
    // var events = appointments;


    var timeOffEvents = [{
      id: '1', // time_off_id,
      title: 'Tech 2 Off', // maybe put tech name in here later, e.g. "Ben Off"
      start: todayDate + 'T12:30:00', // toff_start_iso_8601,
      end: todayDate + 'T13:30:00', // toff_end_iso_8601,
      notes: 'doctor appointment',
      resourceId: '2', // tech_id (user_id in technician_schedules)
    }];

    // var timeOffQueryString = `SELECT time_off_id,
    //                             tech_id,
    //                             toff_start_iso_8601,
    //                             toff_end_iso_8601,
    //                             notes
    //                           FROM time_off`;
    // con.query(timeOffQueryString,function(err,toff_rows){
    // if(err) throw err;
    // console.log('\nAll timeOffEvents:\n');
    // console.log('toff_rows:\n' + toff_rows);

    // var timeOffEvents = [];
    // for (var i = 0; i < toff_rows.length; i++) {
    //   console.log('toff_rows ' + i + ':\n' + toff_rows[i]);
    //   console.log('toff_rows ' + i + ' ticket_id:\n' + toff_rows[i].ticket_id);
    //   var timeOffEvent = new Object();
    //   timeOffEvent.id = toff_rows[i].time_off_id;
    //   timeOffEvent.title = 'Tech ' + toff_rows[i].tech_id + 'Off';
    //   timeOffEvent.start = toff_rows[i].appt_start_iso_8601;
    //   timeOffEvent.end = toff_rows[i].appt_end_iso_8601;
    //   timeOffEvent.notes = toff_rows[i].notes;
    //   timeOffEvent.resourceID = toff_rows[i].tech_id;
    //   timeOffEvents.push(timeOffEvent);
    // }
    eventSources.push(timeOffEvents);

    response.eventSources = eventSources;

    // response.events = events;
    res.json(response);
  });
});



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
