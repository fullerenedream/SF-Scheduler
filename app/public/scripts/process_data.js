// *** Here is the format to put the db data into for fullcalendar:

// {
//   "installers": {
//     "installerid": "3",
//     "installername": "Bob",
//     "events": {
//       "mondaymorningblock": {
//         "start": "00:00:00",
//         "end": "09:00:00"
//       },
//       "mondayeveningblock": {
//         "start": "17:00:00",
//         "end": "23:59:59"
//       }
//     }
//   }
// }

// but actually we can just put names in the user_id
// I only made them numbers to be lazy
// *** ----------------------------------------------



// module.exports = {

//   // make sure epochTime is in Local Time
//   // e.g. epoch time 61200 = Thu Jan 01 1970 09:00:00 GMT-0800 (PST)
//   // do not input epoch time in UTC/GMT
//   // epochconverter.com is useful
//   epochToDate: function(epochTime) {
//     // new Date() takes milliseconds, but our epochTime in seconds, so multiply by 1000
//     return new Date(epochTime*1000);
//   }
//   //console.log('try epochToDate on epoch time 61200 = 1 Jan 1970, 9:00 AM Local Time');
//   // var ohNineHundred1970 = epochToDate(61200);
//   //console.log('ohNineHundred1970: ' + ohNineHundred1970);

//   dateToHoursAndMinutes: function(date) {
//     var hours = date.getHours();
//     var hoursString = String(hours);
//     //console.log('hoursString:' + hoursString);
//     var minutes;
//     var minutesString;
//     if (date.getMinutes().toString().length === 2) {
//       minutes = date.getMinutes();
//       minutesString = String(date.getMinutes());
//       //console.log('minutesString:' + minutesString);
//     }
//     else if (date.getMinutes().toString().length === 1){
//       minutesString = String('0') + String(date.getMinutes());
//       //console.log('minutesString:' + minutesString);
//       minutes = parseInt(minutesString, 10);
//       //console.log('minutes:' + minutes);
//     }
//     else {
//       console.log('Error: date.getMinutes().length is not 1 or 2');
//     }
//     var hoursAndMinutesString = hoursString + ':' + minutesString;
//     //console.log('hoursAndMinutesString: ' + hoursAndMinutesString);
//     return hoursAndMinutesString;
//   }
//   // var ohNineHundred = dateToHoursAndMinutes(ohNineHundred1970);
//   //console.log('ohNineHundred: ' + ohNineHundred);

//   // var currentLocalTime = epochToDate(1472152320);
//   //console.log('currentLocalTime: ' + currentLocalTime);
//   // var currentLocalHoursAndMinutes = dateToHoursAndMinutes(currentLocalTime);
//   //console.log('currentLocalHoursAndMinutes: ' + currentLocalHoursAndMinutes);

//   epochToHoursAndMinutes: function(epochTime) {
//     // console.log('epochTime: ' + epochTime);
//     var date = epochToDate(epochTime);
//     // console.log('date: ' + date);
//     var hoursAndMinutes = dateToHoursAndMinutes(date);
//     // console.log('hoursAndMinutes: ' + hoursAndMinutes);
//     return hoursAndMinutes;
//   }

// };



