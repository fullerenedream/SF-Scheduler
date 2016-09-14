var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('fs');
var sampleData = require('../data/sample.json');

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
  con.query('SELECT * FROM technician_schedules',function(err,rows){
    if(err) throw err;
    console.log('\nAll data from technician_schedules table:\n');
    console.log(rows);
    // *** and added this line so that the response to this get request
    // *** is JSONified result of the db query
    res.json(rows);
  });
});

router.get('/api/:user_id', function(req,res){
  var user_id = req.param('user_id');
  var key = user_id;
  var queryString = 'SELECT * FROM technician_schedules ' +
                    'WHERE user_id = ? ' +
                    'ORDER BY created_at DESC ' +
                    'LIMIT 1';
  var con = db.connectToScheduleDB();
  con.query(queryString, [key], function(err,rows){
    if(err) throw err;
    console.log('\nSchedule of Tech with user_id = ' + user_id + ':');
    console.log(rows);
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
