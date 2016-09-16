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
router.get('/api', function(req,res){
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
    var queryString =  `SELECT t1.id, t1.user_id,
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
    con.query(queryString,function(err,rows){
    if(err) throw err;
    console.log('\nAll data from technician_schedules table:\n');
    console.log(rows);

    // *** this is for when eventify(rows) is working
    // var rows_as_events = process_data.eventify(rows);
    // res.json(rows_as_events);

    // *** and added this line so that the response to this get request
    // *** is JSONified result of the db query
    res.json(rows);
  });
});

router.get('/api/:user_id', function(req,res){
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

  var queryString =  `SELECT t1.id, t1.user_id,
                        CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(monday_start,1))) AS start,
                        CONCAT(DATE(NOW())," ",SEC_TO_TIME(IFNULL(monday_end,1))) AS end
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
