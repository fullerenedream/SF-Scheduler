var mysql = require("mysql");

module.exports = {

  // this is incomplete: compare with connectToDatabase()
  // need to end the connection, but how to organize it?
  connectToScheduleDB: function() {
    var con = mysql.createConnection({
      host      : 'localhost',
      user      : 'swiftfox',
      password  : 'swiftfox',
      database  : 'schedule_db'
    });
    con.connect(function(err) {
      if(err){
        console.log('Error connecting to database');
        return;
      }
      console.log('Connection established');
    });
    return con;
  }

};
