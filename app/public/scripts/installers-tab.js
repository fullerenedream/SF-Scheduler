/*
Installers Tab:
- Display installers and their working hours
- Add new installer (this can be with default hours)
- Add/edit installer hours
*/


$(document).ready(function() {

  getAllUsers();

  // get all users
  function getAllUsers() {
    var allUsers = $.getJSON('/api/users', function(data) {
      populateUserTable(data);
    });
  }

  function populateUserTable(data) {
    // clear old data
    $("#installers-table-body").empty();
    console.log('all technicians:', data);
    // add a table row for each user's data
    for (i = 0; i < data.users.length; i++) {
      var tableRowString = "<tr>" +
        "<td>" + data.users[i].username + "</td>" +
        "<td>" + data.users[i].email + "</td>" +
        "<td><button type='button' class='btn btn-default btn-xs' data-id=\"" + data.users[i].id + "\">show working hours</button></td>" +
        "</tr>";
      $("#installers-table-body").append($(tableRowString));
    }
  }

  // when 'New Installer' button is clicked on #installersModal
  $('#new-installer-btn .btn').click(function(){
    console.log('New Installer button was clicked!');
    // clear the modal
    clearInstallersModal();
    // set the modal title and cancel/close button
    $('#installersModalTitle').text('Add New Installer');
    $('#installersModalCancelOrClose').text('Cancel');
    // set user_type to technician
    $('#installerDataDiv').attr('data-type', 'technician');
    // summon the modal
    $('#installersModal').modal();
  });

  // when 'Save' button is clicked on #installersModal
  $('#installersModalSave').click(function(){
    console.log('Installers modal Save button was clicked!');

    userData = {
      user_type: $('#installerDataDiv').attr('data-type'),
      username: $('#installerNameInput').val(),
      email: $('#installerEmailInput').val()
    }
    if ( $('#installerDataDiv').attr('data-id') != null ) {
      userData.user_id = $('#installerDataDiv').attr('data-id');
    }
    console.log('#installersModalSave clicked! JSON.stringified userData: ' + JSON.stringify(userData));

    saveUser(userData);
    console.log('attempting to save user: ', userData);
    $('#installersModal').modal('hide');
    getAllUsers();
  });


  // $('#installersModalCancelOrClose').click(function() {
  //   getAllUsers();
  // });


  // // TODO: add an "Are you sure?" to confirm deletion
  // $('#installersModalDelete').click(function() {
  //   console.log('Installers modal Delete button was clicked!');
  //   var userToDelete;
  //   if ( $('#installerDataDiv').attr('data-id') != null ) {
  //     userToDelete = $('#installerDataDiv').attr('data-id');
  //     console.log('deleting user with ID = ' + userToDelete);
  //     deleteEvent(userToDelete);
  //   }
  //   else {
  //     console.log('there is no User ID - user cannot be deleted');
  //   }
  //   $('#installersModal').modal('hide');
  //   getAllUsers();
  // });


  // // WARNING: this was copypasta'd from scheduler.js - still needs editing!!!!!
  // // populate the form with values from the user object
  // function populateInstallersModal(user) {
  //   // clearInstallersModal();
  //   console.log('populating Installers modal with user data: ', user);

  //   $('#installerDataDiv').attr('data-type', user.userType);
  //   $('#appointmentTypeDiv .status').text(appointmentTypeName);
  //   $('#appointmentTitleInput').val(event.title);
  //   $('#appointmentId').text(event.id);
  //   $('#startInput').text(start_ISO8601);
  //   $('#endInput').text(end_ISO8601);
  //   $('#resourceInput').text(event.resourceId);
  //   $('#customerIdInput').val(event.customerId);
  //   $('#ticketIdInput').val(event.ticketId);
  //   $('#descriptionInput').val(event.description);
  //   $('#appointmentStatusDiv .btn').removeClass('active');

  //   var eventStatus = event.status;
  //   $('#appointmentStatusDiv .radio-btn').each(function() {
  //     if ( $(this).attr('data-appointment_status') == eventStatus ) {
  //       $(this).parent().addClass('active');
  //     }
  //   });
  // }

  // clear all data from the modal
  function clearInstallersModal() {
    console.log('clearing Installers modal');
    $('#installerNameInput').val('');
    $('#installerEmailInput').val('');
    $('#installerDataDiv').attr('data-id', '');
    $('#installerDataDiv').attr('data-type', '');
  }


  // send POST request to /api/users to save user to db
  function saveUser(user) {
    $.ajax({
      type: 'POST',
      url: '/api/users',
      data: user,
      success: function(data) {console.log(data)},
      dataType: 'json'
    });
  }

});
