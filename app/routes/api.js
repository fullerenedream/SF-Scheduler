var express = require('express');
var router = express.Router();
var db = require("../db.js");
var technician_schedules = require("../technician_schedules.js");
var bodyParser = require('body-parser');
var fs = require('fs');

var sampleData = require('../data/sample.json');

// gets data from sample file and returns it as JSON
router.get('/api', function(req,res){
  // db.connectToScheduleDB();
  // var allTechnicians = technician_schedules.getAllTechnicianSchedules();
  // console.log(allTechnicians);
  // res.json(allTechnicians);
  var con = db.connectToScheduleDB();
  con.query('SELECT * FROM technician_schedules',function(err,rows){
    if(err) throw err;
    console.log('\nAll data from technician_schedules table:\n');
    console.log(rows);
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
