var mysql = require("mysql");

module.exports = {

  // this is incomplete: compare with connectToDatabase()
  // in NeoNodoSchedule - need to end the connection,
  // but how to organize it?
  connectToScheduleDB: function() {

    var conn_string = process.env.JAWSDB_URL; //Get the connection string

    var con = mysql.createConnection(conn_string || {
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

  // *** add a function here to close the connection

};
