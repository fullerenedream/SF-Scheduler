var moment = require('../fullcalendar-scheduler-1.4.0/lib/moment.min.js');

/*
TODO: All these validations should be on the client side, not the server side
Note that they are being used in the logic that determines if an event is
Time Off, Unassigned, On Deck, or a regular appointment, in api.js...
*/

module.exports = {

  isBlankOrNull: function(inputVal) {
    var val = inputVal;
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
  },

  isInt: function(inputVal) {
    var val = inputVal;
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
  },

  isPositiveInt: function(inputVal) {
    var val = inputVal;
    if (module.exports.isInt(val) == false) {
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
  },

  isValidDate: function(inputDate) {
    var date = inputDate;
    if ( moment(date, 'YYYY-MM-DD', true).isValid() == false ) {
      console.log('invalid date: it is not of the form YYYY-MM-DD');
      return false;
    }
    else return true;
  },

  isValidTime: function(inputTime) {
    var time = inputTime;
    if ( moment(time, 'HH:mm:ss', true).isValid() == false ) {
      console.log('invalid time: it is not of the form HH:mm:ss');
      return false;
    }
    else return true;
  },

  isValidISO8601: function(inputISO8601) {
    var ISO8601 = inputISO8601;
    if ( moment(ISO8601, 'YYYY-MM-DDTHH:mm:ss', true).isValid() == false ) {
      console.log(ISO8601 + ' is invalid ISO8601: it is not of the form YYYY-MM-DDTHH:mm:ss');
      return false;
    }
    else {
    console.log(ISO8601 + ' is valid ISO8601');
    return true;
    }
  },

  hasDateAndStartTime: function(inputAppointment) {
    var appointment = inputAppointment;
    if ( module.exports.isValidDate(appointment[3]) && module.exports.isValidTime(appointment[4]) ) {
      console.log('appointment has valid date and start time');
      return true;
    }
    else if ( module.exports.isValidISO8601(appointment[6]) ){
      console.log('appointment has valid ISO8601 start time');
      return true;
    }
    else {
      console.log('appointment is missing date and/or start time');
      return false;
    }
  },

  hasDateStartAndEndTime: function(inputAppointment) {
    var appointment = inputAppointment;
    if ( module.exports.isValidDate(appointment[3]) && module.exports.isValidTime(appointment[4]) && module.exports.isValidTime(appointment[5])) {
      console.log('appointment has valid date, start and end times');
      return true;
    }
    else if ( module.exports.isValidISO8601(appointment[6]) && module.exports.isValidISO8601(appointment[7]) ){
      console.log('appointment has valid ISO8601 start and end times');
      return true;
    }
    else {
      console.log('appointment is missing date, start or end time');
      return false;
    }
  },

  // WARNING: tech_id's are temporarily hard-coded in this function
  // TODO: make function check to see if this tech_id exists in db
  isValidTechId: function(inputTech_id) {
    var tech_id = inputTech_id;
    if (tech_id == 1 || tech_id == 2 || tech_id == 3) {
      console.log('valid tech_id: ' + tech_id);
      return true;
    }
    else {
      console.log('invalid tech_id: ' + tech_id);
      return false;
    }
  },

  // WARNING: appointment_type values are temporarily hard-coded in this function
  // TODO: make function check to see if this appointment_type exists in db
  isValidAppointmentType: function(inputAppointment_type) {
    var appointment_type = inputAppointment_type;
    if ( (appointment_type >= 1 && appointment_type <= 5) || appointment_type == 8 || appointment_type == 10 ) {
      console.log('appointment_type is valid');
      return true;
    }
    else {
      console.log('appointment_type is invalid');
      return false;
    }
  },

  // checks appointment_type to see if it is Time Off (=10)
  isTimeOff: function(inputAppointment) {
    var appointment = inputAppointment;
    if (appointment[0] == '10') {
      console.log(appointment[0]);
      console.log('appointment is Time Off');
    }
    else {
      console.log(appointment[0]);
      console.log('appointment is not Time Off');
    }
    return appointment[0] == '10' ? true : false;
  },

  // if appointment is not time off, and date or start time are blank or null, appointment is an On Deck item
  isOnDeck: function(inputAppointment) {
    var appointment = inputAppointment;
    if (  (!module.exports.isTimeOff(appointment)) && ( module.exports.isBlankOrNull(appointment[3]) || module.exports.isBlankOrNull(appointment[4]) )  ) {
      console.log('appointment is On Deck');
      return true;
    }
    else {
      console.log('appointment is not On Deck');
      return false;
    }
  },

  // if appointment has no tech_id, is not Time off, has date and time -> appointment is Unassigned
  isUnassigned: function(inputAppointment) {
    var appointment = inputAppointment;
    if ( module.exports.isBlankOrNull(appointment[2]) && (!module.exports.isTimeOff(appointment)) &&  module.exports.isValidDate(appointment[3]) && module.exports.isValidTime(appointment[4]) && module.exports.isValidTime(appointment[5]) ) {
      console.log('appointment is Unassigned');
      return true;
    }
    else {
      console.log('appointment is not Unassigned');
      return false;
    }
  }

};
