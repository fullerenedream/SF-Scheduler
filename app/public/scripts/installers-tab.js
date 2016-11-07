/*
Installers Tab:
- Display installers and their working hours
- Add new installer (this can be with default hours)
- Add/edit installer hours
*/


$(document).ready(function() {

  // get all users
  var allUsers = $.getJSON('/api/users', function(data) {
    // makeUserDivs(data);
    populateUserTable(data);
  });

  function makeUserDivs(data) {
    console.log('all technicians:', data);

    for (i = 0; i < data.users.length; i++) {
      var userDivString = "<div class='installer-info' id='" + data.users[i].id +
        "' data-id='" + data.users[i].id +
        "' data-type='" + data.users[i].type +
        "' data-username=\"" + data.users[i].username +
        "\" data-email='" + data.users[i].email +
        "'>Name: " + data.users[i].username +
        "&emsp;Installer ID: " + data.users[i].id +
        "&emsp;Email Address: " + data.users[i].email +
        // "&emsp;<button type='button' class='btn btn-info btn-xs'>Working Hours</button>" +
        "</div>";
      $("#installers-list").append($(userDivString));
    }
  }

  function populateUserTable(data) {
    console.log('all technicians:', data);
    for (i = 0; i < data.users.length; i++) {
      var tableRowString = "<tr>" +
        // "<th scope=\"row\"" + data.users[i].id + "</th>" +
        "<td>" + data.users[i].username + "</td>" +
        "<td>" + data.users[i].email + "</td>" +
        "<td><button type='button' class='btn btn-default btn-xs' data-id=\"" + data.users[i].id + "\">show working hours</button></td>" +
        "</tr>";
      $("#installers-table-body").append($(tableRowString));
    }
  }

  $('#new-installer-btn .btn').click(function(){
    console.log('New Installer button was clicked!');
    // clear the modal
    // clearInstallersModal();
    // set the modal title and cancel/close button
    $('#installersModalTitle').text('Add New Installer');
    $('#installersModalCancelOrClose').text('Cancel');
    // summon the modal
    $('#installersModal').modal();
  });



});
