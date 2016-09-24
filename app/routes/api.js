var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('fs');
var sampleData = require('../data/sample.json');
var process_data = require('../public/scripts/process_data.js');
// *** added the db.js and technician_schedules.js files pretty much as-is from NeoNodoSchedule
var db = require("../db.js");
var technician_schedules = require("../technician_schedules.js");

// GET the whole technician_schedules table
router.get('/api/technician_schedules', function(req,res){
  // db.connectToScheduleDB();
  // var allTechnicians = technician_schedules.getAllTechnicianSchedules();
  // console.log(allTechnicians);
  // res.json(allTechnicians);

  // *** copied the guts of getAllTechnicianSchedules into this api get request
  var con = db.connectToScheduleDB();
  // *** IFNULL(column, replacement value if column is null)
  // SEC_TO_TIME converts a number of seconds into 00:00:00 format (hh:mm:ss)
  // TIME_TO_SEC is also a thing - it's the inverse
  // CONCAT(DATE(NOW()) hh:mm:ss) - CONCAT(A,' ',B) -> 'A B'
  // when we call the event source from fullcalendar, there's an option where
  // you can specify timezone - in case we need to convert timezones.
  // var queryString =  `SELECT t1.id, t1.user_id,
  //                      CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(tuesday_start,1))) AS start,
  //                      CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(tuesday_end,1))) AS end
  //                     FROM technician_schedules t1
  //                     WHERE t1.created_at = (
  //                       SELECT MAX(t2.created_at)
  //                       FROM technician_schedules t2
  //                       WHERE t2.user_id = t1.user_id)`;

  // var queryString =  `SELECT t1.id, t1.user_id,
  //                       SEC_TO_TIME(IFNULL(tuesday_start,1)) AS start,
  //                       SEC_TO_TIME(IFNULL(tuesday_end,1)) AS end
  //                     FROM technician_schedules t1
  //                     WHERE t1.created_at = (
  //                       SELECT MAX(t2.created_at)
  //                       FROM technician_schedules t2
  //                       WHERE t2.user_id = t1.user_id)`;


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

    // iterate over ts_rows into a valid JSON string
    // that's what fullcalendar wants resources to look like

    // response to this get request is currently the JSONified result of the db query

    // this is the dummy data we're feeding fullcalendar-scheduler right now:
    // resources: [
    //   {
    //     id: 'a',
    //     title: 'Sam',
    //     businessHours: {
    //         start: '07:00',
    //         end: '15:00'
    //     }
    //   },
    //   {
    //     id: 'b',
    //     title: 'Pat',
    //     businessHours: {
    //         start: '09:00',
    //         end: '17:00'
    //     }
    //   },
    //   {
    //     id: 'c',
    //     title: 'Kim',
    //     businessHours: {
    //         start: '11:00',
    //         end: '19:00'
    //     }
    //   }
    // ]
    // right now the response looks like this:
    // "[{"id":1,"user_id":0,"sunday_start":null,"sunday_end":null,"monday_start":"07:00:00","monday_end":"19:00:00","tuesday_start":"07:00:00","tuesday_end":"19:00:00","wednesday_start":"07:00:00","wednesday_end":"19:00:00","thursday_start":"07:00:00","thursday_end":"19:00:00","friday_start":"07:00:00","friday_end":"19:00:00","saturday_start":null,"saturday_end":null},{"id":2,"user_id":1,"sunday_start":null,"sunday_end":null,"monday_start":"07:00:00","monday_end":"15:00:00","tuesday_start":"07:00:00","tuesday_end":"15:00:00","wednesday_start":"07:00:00","wednesday_end":"15:00:00","thursday_start":"07:00:00","thursday_end":"15:00:00","friday_start":"07:00:00","friday_end":"15:00:00","saturday_start":null,"saturday_end":null},{"id":5,"user_id":3,"sunday_start":null,"sunday_end":null,"monday_start":"09:00:00","monday_end":"16:00:00","tuesday_start":null,"tuesday_end":null,"wednesday_start":"09:00:00","wednesday_end":"16:00:00","thursday_start":null,"thursday_end":null,"friday_start":"09:00:00","friday_end":"16:00:00","saturday_start":null,"saturday_end":null},{"id":9,"user_id":2,"sunday_start":null,"sunday_end":null,"monday_start":null,"monday_end":null,"tuesday_start":"11:00:00","tuesday_end":"19:00:00","wednesday_start":"11:00:00","wednesday_end":"19:00:00","thursday_start":"11:00:00","thursday_end":"19:00:00","friday_start":"11:00:00","friday_end":"19:00:00","saturday_start":null,"saturday_end":null}]"
    var response = new Object();
    var resources = [];
    for (var i = 0; i < ts_rows.length; i++) {
      console.log('ts_rows ' + i + ':\n' + ts_rows[i]);
      console.log('ts_rows ' + i + ' user_id:\n' + ts_rows[i].user_id);
      var resource = new Object();
      resource.businessHours = [];
      resource.id = ts_rows[i].schedule_id;
      resource.title =ts_rows[i].user_name; // or we could use user_id
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

    // DO THIS LIKE RESOURCES AS ABOVE
    var events = [{
      id: 1, // id
      title: 'Full Install', // title
      ticketId: '101', // ticket_id
      appointmentType: 'Install', // appointment_type
      description: 'Install wifi chez Joe Blow', // description
      start: '2016-09-23T10:00:00', // start_time
      end: '2016-09-23T12:00:00', // end_time
      status: '0', // status   (0, 1 or 2)
      resourceId: '1', // tech_id
    }];
    response.events = events;
    res.json(response);
  });
});

router.get('/api/technician_schedules/:user_id', function(req,res){
  var user_id = req.param('user_id');
  var key = user_id;
  // var queryString = 'SELECT user_id
  //                     'sunday_start, ' +
  //                     'sunday_end, ' +
  //                     'monday_start, ' +
  //                     'monday_end, ' +
  //                     'tuesday_start, ' +
  //                     'tuesday_end, ' +
  //                     'wednesday_start, ' +
  //                     'wednesday_end, ' +
  //                     'thursday_start, ' +
  //                     'thursday_end, ' +
  //                     'friday_start, ' +
  //                     'friday_end, ' +
  //                     'saturday_start, ' +
  //                     'saturday_end ' +
  //                   'FROM technician_schedules ' +
  //                   'WHERE user_id = ? ' +
  //                   'ORDER BY created_at DESC ' +
  //                   'LIMIT 1';

  // var queryString =  `SELECT t1.id, t1.user_id,
  //                       CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(monday_start,1))) AS start,
  //                       CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(monday_end,1))) AS end
  //                     FROM technician_schedules t1
  //                     WHERE t1.created_at = (
  //                       SELECT MAX(t2.created_at)
  //                       FROM technician_schedules t2
  //                       WHERE t2.user_id = t1.user_id)
  //                     AND t1.user_id = ?`;

  // var queryString =  `SELECT t1.id, t1.user_id,
  //                       CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(monday_start,1))) AS start,
  //                       CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(monday_end,1))) AS end
  //                     FROM technician_schedules t1
  //                     WHERE t1.created_at = (
  //                       SELECT MAX(t2.created_at)
  //                       FROM technician_schedules t2
  //                       WHERE t2.user_id = t1.user_id)
  //                     AND t1.user_id = ?`;

  var queryString =  `SELECT t1.id, t1.user_id,
                      (IFNULL(wednesday_start,1)) AS start,
                      (IFNULL(wednesday_end,1)) AS end
                    FROM technician_schedules t1
                    WHERE t1.created_at = (
                      SELECT MAX(t2.created_at)
                      FROM technician_schedules t2
                      WHERE t2.user_id = t1.user_id)
                    AND t1.user_id = ?`;

  var con = db.connectToScheduleDB();
  con.query(queryString, [key], function(err,rows){
    if(err) throw err;
    console.log('\nSchedule of Tech with user_id = ' + user_id + ':');
    console.log(rows);
    // rows[0].tuesday_start = process_data.epochToHoursAndMinutes(rows[0].tuesday_start);
    // rows[0].tuesday_start = 1;
    // *** added this line so that the response to this get request
    // *** is JSONified result of the db query
    res.json(rows);
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
