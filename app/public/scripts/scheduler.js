// I used this demo to get started:
// http://code.runnable.com/UfNTSnKMU1ZgAACt/how-to-add-calendar-using-jquery-and-fullcalendar
// some of the code and comments are still in here

var appointmentTypes;
var onDeckEvents;

$(document).ready(function() {

  var todayDate = new Date().toISOString().substring(0,10);
  console.log(todayDate);

  getAppointmentTypes();
  getOnDeckEvents();
  loadCalendar();

  // reset bootstrap modal upon close
  $('#fullCalModal').on('hidden.bs.modal', function () {
    // clear data from text fields
    $('.modal-body').find('text,textarea,input').val('');
    // reset dropdowns' displayed text and value
    // TODO: initial display text is hardcoded - make it read from the html instead
    $('.dropdown .status').text('Appointment Type');
    $('.dropdown .status').attr('data-current_value', '');
  });

  // get all technicians and send them to tech dropdown
  var allUsers = $.getJSON('/api/users', function(data) {
    initTechDropdown(data);
  });

  // make the tech dropdown menu work
  function initTechDropdown(data) {
    console.log('all users:');
    console.log(data);
    // generate html for each tech to go in dropdown
    var users = '';
    for (i = 0; i < data.users.length; i++) {
      var user = '<option value="' + data.users[i].id + '">' + data.users[i].username + '</option>';
      users += user;
    }
    // populate dropdown with techs
    $('select#installer-selector').append(users);
    // when new tech is selected, call loadTechCalendar() for that tech
    $('select#installer-selector').change(function() {
      var selectedTechId = $('select#installer-selector').val();
      console.log('selectedTechId: ' + selectedTechId);
      loadTechCalendar(selectedTechId);
    });
  }

    // // WARNING!!! THIS IS NOT FINISHED!!!!!!

    // function populateTechDropdown() {
    //   for (var i in data.users) {
    //     var userString = "<li><a data-user_id=\"" + data.users[i].id + "\" href=\"#\">" + data.users[i].username + "</a></li>";
    //     $("#installer-dropdown-ul").append($(userString));
    //   }
    //   initiateTechDropdown();
    // }
    // function initiateTechDropdown() {
    //   $('#installer-dropdown-ul li > a').click(function(){
    //     console.log('dropdown item was selected!');
    //     $('.status').text($(this).text());
    //     console.log( $('.status').text() );
    //     $('.status').attr('data-current_value', $(this).attr('data-username') );
    //     console.log('dropdown current value: ' + $('.status').attr('data-current_value'));
    //   });
    // }







  // draw the calendar with all resources and events
  function loadCalendar(view = 'agendaDay') {
    console.log('currentView: ', view);
    $.getJSON('/api/resources_and_events', function(data) {
      console.log('loadCalendar: ', data);
      // clear calendar of old data
      $('#fullcalendar').replaceWith('<div id="fullcalendar"></div>');
      // draw calendar with new data
      drawFullCalendar(data, view);
    });
  }



  // re-draw fullcalendar based on what was selected in dropdown
  function loadTechCalendar(techId) {
    // store the current calendar view (day/week/month) in a variable
    var currentView = $('#fullcalendar').fullCalendar('getView');
    // if techID is a number > 0, re-draw calendar with resources and events of the tech with that techID
    // *** this seems vulnerable - should make condition stronger to protect against weird inputs
    if (techId > 0) {
      // console.log('inside loadTechCalendar - tech id = ' + techId);
      console.log('inside loadTechCalendar - /api/resources_and_events/' + techId);
      // GET all resources and events for a given tech
      $.getJSON('/api/resources_and_events/' + techId, function(data) {
        // clear the fullcalendar div, then draw it with the data from the GET request
        $('#fullcalendar').replaceWith('<div id="fullcalendar"></div>');
        drawFullCalendar(data);
        // make the view (day/week/month) match what it was before we re-drew the calendar
        $('#fullcalendar').fullCalendar('changeView', currentView.name);
      });
    }
    // if techID is 'AllInstallers', re-draw calendar with resources and events of all techs
    else if (techId == 'AllInstallers') {
      console.log('inside loadTechCalendar - /api/resources_and_events/' + techId);
      $.getJSON('/api/resources_and_events', function(data) {
        $('#fullcalendar').replaceWith('<div id="fullcalendar"></div>');
        drawFullCalendar(data);
        $('#fullcalendar').fullCalendar('changeView', currentView.name);
      });
    }
    // if techID is neither a real techID nor the string 'AllInstallers', show an error message
    else {
      console.log('Error! Unexpected value in Installers dropdown');
    }
  }



  // generate draggable appointment-type divs and populate the New Event section
  function getAppointmentTypes() {
    $.getJSON('/api/calendar_itemtypes', function(data) {
      loadedAppointmentTypes(data);
      console.log('data from inside getAppointmentTypes: ', data);
    })
  }
  function loadedAppointmentTypes(response) {
    appointmentTypes = response.ciTypes;
    console.log('appointmentTypes from inside loadedAppointmentTypes(): ' + JSON.stringify(appointmentTypes));
    drawAppointmentTypes();
    populateAppointmentTypeDropdown();
  }
  function drawAppointmentTypes() {
    $("#appointment-templates").empty();
    for (var type in appointmentTypes) {
      console.log(type);

      var divString = "<div class='new-appointment' id='" + type +
        "' style='background-color:" + appointmentTypes[type].color +
        "' data-title='" + appointmentTypes[type].name +
        "' data-color='" + appointmentTypes[type].color +
        "' data-duration='00:" + appointmentTypes[type].duration + ":00" +
        "' data-status='0" +
        "' data-appointment_type='" + appointmentTypes[type].id +
        "'>" + appointmentTypes[type].name +
        "</div>"
      $("#appointment-templates").append($(divString));
    }
    $("#appointment-templates").prepend("<h4>New Event:</h4>");

    $("#appointment-templates div.new-appointment").each(function(){
      // store data so the calendar knows to render an event upon drop
      $(this).data('event', {
        title: $(this).data('title'),
        customerId: $(this).data('customer_id'),
        ticketId: $(this).data('ticket_id'),
        appointmentType: $(this).data('appointment_type'),
        status: $(this).data('status'),
        description: $(this).data('description'),
        color: $(this).data('color')//, // uncomment the comma if you uncomment stick!
        // stick: true // maintain when user navigates (see docs on the renderEvent method)
      });
      // make the event draggable using jQuery UI
      $(this).draggable({
        zIndex: 999,
        revert: true,
        revertDuration: 0
      });
    });
  }

  function populateAppointmentTypeDropdown() {
    for (var i in appointmentTypes) {
      var liString = "<li><a data-appointment_type=\"" + appointmentTypes[i].id + "\" href=\"#\">" + appointmentTypes[i].name + "</a></li>"
      $("#appointmentTypeDropdown").append($(liString));
    }
    initiateDropdown();
  }
  function initiateDropdown() {
    $('.dropdown-menu li > a').click(function(){
      console.log('dropdown item was selected!');
      $('.status').text($(this).text());
      console.log( $('.status').text() );
      $('.status').attr('data-current_value', $(this).attr('data-appointment_type') );
      console.log('dropdown current value: ' + $('.status').attr('data-current_value'));
    });
  }


  // search appointmentTypes: find an appointmentType's index using its appointmentType ID
  function getAppointmentTypeIndexById(appointmentTypeID) {
    console.log('getting appointmentType index by appointmentType ID');
    console.log('appointmentTypeID: ', appointmentTypeID);
    var index = appointmentTypes.map(function(el) {
      return el.id;
    }).indexOf(appointmentTypeID);
    console.log('appointmentType ' + appointmentTypeID + ' has this index: ' + index);
    return index;
  }



  // generate draggable divs of On Deck events and populate the On Deck section
  function getOnDeckEvents() {
    $.getJSON('/api/on_deck_events', function(data) {
      loadedOnDeckEvents(data);
      console.log('data from inside getOnDeckEvents: ', data);
    })
  }
  function loadedOnDeckEvents(response) {
    onDeckEvents = response.onDeckEvents;
    console.log('onDeckEvents from inside loadedOnDeckEvents(): ' + JSON.stringify(onDeckEvents));
    // wait for appointmentTypes to load before calling makeOnDeckSection()
    waitForAppointmentTypes();
  }
  function waitForAppointmentTypes() {
    if (typeof appointmentTypes !== "undefined") {
      console.log('appointmentTypes is now defined - calling makeOnDeckSection()');
      makeOnDeckSection();
    }
    else {
      console.log('appointmentTypes is not yet defined - waiting 1/4 second and checking again');
      setTimeout(function() {
        waitForAppointmentTypes();
      }, 250);
    }
  }
  function makeOnDeckSection() {
    $("#on-deck").empty();
    if (onDeckEvents.length == 0) {
      $('#on-deck').append('<h6>No On Deck Events</h6>');
    }
    // generate html for On Deck events for makeOnDeckSection to operate on
    for (var i = 0; i < onDeckEvents.length; i++) {
      var index = getAppointmentTypeIndexById(onDeckEvents[i].appointmentType);
      console.log('index: ', index);
      var thisEventDuration = appointmentTypes[index].duration;
      console.log('thisEventDuration: ', thisEventDuration);

      var onDeckEvent = "<div class=\"fc-event on-deck-event " + //onDeckEvents[i].className +
        "\" style=\"background-color:" + onDeckEvents[i].color +
        "\" data-appointment_id=\"" + onDeckEvents[i].id +
        "\" data-title=\"" + onDeckEvents[i].title +
        "\" data-customer_id=\"" + onDeckEvents[i].customerId +
        "\" data-ticket_id=\"" + onDeckEvents[i].ticketId +
        "\" data-appointment_type=\"" + onDeckEvents[i].appointmentType +
        "\" data-status=\"" + onDeckEvents[i].status +
        "\" data-description=\"" + onDeckEvents[i].description +
        "\" data-color=\"" + onDeckEvents[i].color +
        "\" data-duration=\"00:" + thisEventDuration + ":00" +
        "\">" + onDeckEvents[i].title + "</div>";
      console.log('onDeckEvent from db' + onDeckEvent);
      $('#on-deck').append(onDeckEvent);
    }
    $('#on-deck').prepend("<h4>Backlog:</h4>")
    $('#on-deck .fc-event').each(function() {
      // store data so the calendar knows to render an event upon drop
      $(this).data('event', {
        id: $(this).data('appointment_id'),
        title: $(this).data('title'),
        customerId: $(this).data('customer_id'),
        ticketId: $(this).data('ticket_id'),
        appointmentType: $(this).data('appointment_type'),
        status: $(this).data('status'),
        description: $(this).data('description'),
        color: $(this).data('color')//, // uncomment the comma if you uncomment stick!
        // stick: true // maintain when user navigates (see docs on the renderEvent method)
      });
      // make the event draggable using jQuery UI
      $(this).draggable({
        zIndex: 999,
        revert: true,      // will cause the event to go back to its
        revertDuration: 0  //  original position after the drag
      });
    });
    // launch modal to View/Edit when On Deck event is clicked
    $('.on-deck-event').click(function(){
      console.log('On Deck event clicked!');
      console.log('$(this): ', $(this));
      // console.log("$(this).data('title'): ", $(this).data('title'));
      // console.log("$(this).data('appointment_id'): ", $(this).data('appointment_id'));
      var onDeckEventDiv = $(this);
      // console.log("onDeckEventDiv.data('title'): ", onDeckEventDiv.data('title'));
      // console.log("onDeckEventDiv.data('appointment_id'): ", onDeckEventDiv.data('appointment_id'));


      // var onDeckEventData = {
      //   appointment_id: onDeckEventDiv.data('appointment_id'),
      //   title: onDeckEventDiv.data('title'),
      //   customer_id: onDeckEventDiv.data('customer_id'),
      //   ticket_id: onDeckEventDiv.data('ticket_id'),
      //   appointment_type: onDeckEventDiv.data('appointment_type'),
      //   status: onDeckEventDiv.data('status'),
      //   description: onDeckEventDiv.data('description'),
      //   color: onDeckEventDiv.data('color'),
      //   duration: onDeckEventDiv.data('duration'),
      // }
      // console.log('onDeckEventData: ', onDeckEventData);


      // set the modal title and cancel/close button
      $('#modalTitle').text('View/Edit Backlog Item');
      $('#modalCancelOrClose').text('Close');
      // hide start time, end time, appointment ID, & installer options
      $('#appointmentStartDiv').hide();
      $('#appointmentEndDiv').hide();
      $('#appointmentIdDiv').hide();
      $('#appointmentResourceDiv').hide();
      // populate the form with values from the On Deck event
      populateOnDeckModal(onDeckEventDiv);
      // summon the modal
      $('#fullCalModal').modal();
    });
  }



  // initialize the calendar

  function drawFullCalendar(calendarData, view = 'agendaDay') {
    console.log('calendarData.resources:')
    console.log(calendarData.resources);
    console.log('inside drawFullCalendar - calendarData: ')
    console.log(calendarData);
    var calendar = $('#fullcalendar').fullCalendar({
      schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

      // You can also dynamically set a calendar's height after initialization - see docs
      height: 600,
      editable: true, // enable draggable events
      droppable: true, // this allows things to be dropped onto the calendar
      aspectRatio: 1.8,
      scrollTime: '06:00', // 6am is default scrollTime, but we may wish to change this
      allDaySlot: false,
      snapDuration: '00:15:00',
      navLinks: true,
      eventOverlap: false,
      forceEventDuration: true, // force calculation of an event's end if it is unspecified
      defaultTimedEventDuration: '02:00:00', // 2 hours is fc's default duration, but we may wish to change this
      header: {
        left: 'prev,today,next',
        center: 'title',
        right: 'agendaDay,agendaWeek,month'
      },
      defaultView: view,
      selectable: true,
      selectHelper: true,

      // click & drag on the calendar to create an event
      select: function(start, end, jsEvent, view, resource) {
        var start_ISO8601 = start.format('YYYY-MM-DD[T]HH:mm:ss');
        var end_ISO8601 = end.format('YYYY-MM-DD[T]HH:mm:ss');
        // set the modal title and cancel/close button
        $('#modalTitle').text('Create Appointment');
        $('#modalCancelOrClose').text('Cancel');
        // clear appointment ID
        $('#appointmentId').text('');
        // hide appointment ID (event won't have one until it's saved)
        $('#appointmentIdDiv').hide();
        // populate the form with initial values
        $('#startInput').text(start_ISO8601);
        $('#endInput').text(end_ISO8601);
        $('#resourceInput').text(resource.id);
        // set radio buttons so 'Active' is selected (status == 0)
        $('#appointmentStatusDiv .radio-btn').each(function() {
          if ( $(this).attr('data-appointment_status') == 0 ) {
            $(this).parent().addClass('active');
          }
        });
        // summon the modal
        $('#fullCalModal').modal();
        // now that we've sent the rest of the job to the modal, de-select the selected area
        calendar.fullCalendar('unselect');
      },

      resourceLabelText: 'Installers',
      // ************************ comment out for testing events without resources
      resources: calendarData.resources,
      // ************************ comment out for testing resources without events
      eventSources: calendarData.eventSources,

      // triggered while an event is being rendered
      eventRender: function(event, element, view) {
        // if event is Unassigned, allow overlap
        if (event.resourceId == 0) {
          event.overlap = true;
        }
        // add event description after event title
        if (event.description) {
          var descriptionDiv = '<div>' + event.description + '</div>';
          $('div.fc-title', element).append(descriptionDiv);
        }
        // add event notes after event title
        if (event.notes) {
          var notesDiv = '<div>' + event.notes + '</div>';
          $('div.fc-title', element).append(notesDiv);
        }
      },

      drop: function(date, jsEvent, ui, resourceId) {
        console.log('drop', date.format(), resourceId);
        // remove the element from the "Draggable Events" list
        // if it's an On Deck event
        console.log($(this));
        if ( $(this).hasClass('fc-event') ) {
          $(this).remove();
        }
      },

      // called when an external element, containing event data, is dropped on the calendar
      eventReceive: function(event) {
        console.log('eventReceive', event);
        // set the modal title and cancel/close button
        $('#modalTitle').text('Create Appointment');
        $('#modalCancelOrClose').text('Cancel');
        // if new appointment, hide appointment ID (event won't have one until it's saved)
        if (event.id == null || event.id == '') {
          console.log('no event.id... hiding #appointmentIdDiv');
          $('#appointmentIdDiv').hide();
        }
        // populate the form with values from the event object
        populateModal(event);
        // summon the modal
        $('#fullCalModal').modal();
      },

      // called when an event (already on the calendar) is moved -
      // triggered when dragging stops and the event has moved to a *different* day/time
      eventDrop: function (event, delta, revertFunc, jsEvent, view) {
        console.log('eventDrop', event);
        // set the modal title and cancel/close button
        $('#modalTitle').text('View/Edit Appointment');
        $('#modalCancelOrClose').text('Cancel');
        // populate the form with values from the event object
        populateModal(event);
        // summon the modal
        $('#fullCalModal').modal();
      },

      // triggered when the user clicks an event
      eventClick: function (event, jsEvent, view) {
        console.log('eventClick', event);
        // set the modal title and cancel/close button
        $('#modalTitle').text('View/Edit Appointment');
        $('#modalCancelOrClose').text('Close');
        // populate the form with values from the event object
        populateModal(event);
        // summon the modal
        $('#fullCalModal').modal();
      },

      eventResize: function (event, delta, revertFunc, jsEvent, ui, view) {
        console.log('eventResize', event);
        // set the modal title and cancel/close button
        $('#modalTitle').text('View/Edit Appointment');
        $('#modalCancelOrClose').text('Close');
        // populate the form with values from the event object
        populateModal(event);
        // summon the modal
        $('#fullCalModal').modal();
      }


      // other fullCalendar options can be added here...


    }); // end of var calendar
  } // end of function drawFullCalendar(calendarData)


  // launch modal set up for creating new On Deck event
  $('#new-on-deck-btn').click(function(){
    console.log('New Backlog Item button was clicked!');
    // clear the modal
    clearModal();
    // set the modal title and cancel/close button
    $('#modalTitle').text('Create Backlog Item');
    $('#modalCancelOrClose').text('Cancel');
    // set radio buttons so 'Active' is selected (status == 0)
    $('#appointmentStatusDiv .radio-btn').each(function() {
      if ( $(this).attr('data-appointment_status') == 0 ) {
        $(this).parent().addClass('active');
      }
    });
    // hide Time Off from dropdown, & start time, end time, appointment ID, installer options
    $("a[data-appointment_type='10']").hide();
    $('#appointmentStartDiv').hide();
    $('#appointmentEndDiv').hide();
    $('#appointmentIdDiv').hide();
    $('#appointmentResourceDiv').hide();
    // summon the modal
    $('#fullCalModal').modal();
  });



  // when 'Save' button is clicked on #fullCalModal bootstrap modal
  $('#modalSave').click(function(){
    console.log('modal Save button was clicked!');
    currentView = $('#fullcalendar').fullCalendar('getView').name;
    var eventData = {};

    eventData = {
      appointment_type: $('#appointmentTypeDiv .status').attr('data-current_value'),
      title: $('#appointmentTitleInput').val(),
      customer_id: $('#customerIdInput').val(),
      ticket_id: $('#ticketIdInput').val(),
      description: $('#descriptionInput').val(),
      status: $('#appointmentStatusDiv .active .radio-btn').attr('data-appointment_status')
    }
    if ($('#resourceInput').text() != null) {
      eventData.tech_id = $('#resourceInput').text();
    }
    if ($('#startInput').text() != null) {
      eventData.appt_start_iso_8601 = $('#startInput').text();
    }
    if ($('#endInput').text() != null) {
      eventData.appt_end_iso_8601 = $('#endInput').text();
    }
    if ($('#appointmentId').text() != null) {
      eventData.appointment_id = $('#appointmentId').text();
    }
    console.log('#modalSave clicked! JSON.stringified eventData: ' + JSON.stringify(eventData));

    saveEvent(eventData);
    console.log('saving event: ', eventData);
    $('#fullCalModal').modal('hide');
    showHiddenModalDivs();
    getOnDeckEvents();
    loadCalendar(currentView);
  });


  $('#modalCancelOrClose').click(function() {
    currentView = $('#fullcalendar').fullCalendar('getView').name;
    showHiddenModalDivs();
    getOnDeckEvents();
    loadCalendar(currentView);
  });


  // TODO: add an "Are you sure?" to confirm deletion
  $('#modalDelete').click(function() {
    console.log('modal Delete button was clicked!');
    currentView = $('#fullcalendar').fullCalendar('getView').name;
    var eventToDelete;
    if ($('#appointmentId').text() != null) {
      eventToDelete = $('#appointmentId').text();
      console.log('deleting event with ID = ' + eventToDelete);
      deleteEvent(eventToDelete);
    }
    else {
      console.log('there is no Appointment ID - event cannot be deleted');
    }
    $('#fullCalModal').modal('hide');
    showHiddenModalDivs();
    getOnDeckEvents();
    loadCalendar(currentView);
  });


  // populate the form with values from the event object
  function populateModal(event) {
    console.log('populateModal');
    clearModal();
    console.log('populating modal with event: ', event);
    var start_ISO8601 = event.start.format('YYYY-MM-DD[T]HH:mm:ss');
    var end_ISO8601 = event.end.format('YYYY-MM-DD[T]HH:mm:ss');

    var index = getAppointmentTypeIndexById(event.appointmentType);
    console.log('index: ', index);
    var appointmentTypeName = appointmentTypes[index].name;
    console.log('appointmentTypeName: ', appointmentTypeName);

    $('#appointmentTypeDiv .status').attr('data-current_value', event.appointmentType);
    $('#appointmentTypeDiv .status').text(appointmentTypeName);
    $('#appointmentTitleInput').val(event.title);
    $('#appointmentId').text(event.id);
    $('#startInput').text(start_ISO8601);
    $('#endInput').text(end_ISO8601);
    $('#resourceInput').text(event.resourceId);
    $('#customerIdInput').val(event.customerId);
    $('#ticketIdInput').val(event.ticketId);
    $('#descriptionInput').val(event.description);
    $('#appointmentStatusDiv .btn').removeClass('active');

    var eventStatus = event.status;
    $('#appointmentStatusDiv .radio-btn').each(function() {
      // console.log($(this));
      if ( $(this).attr('data-appointment_status') == eventStatus ) {
        // console.log(eventStatus);
        $(this).parent().addClass('active');
      }
    });
  }

  // populate the form with values from the On Deck event div
  function populateOnDeckModal(onDeckEventDiv) {
    console.log('populateOnDeckModal');
    clearModal();
    console.log('populating modal with info from On Deck event div');

    var event = {
      id: onDeckEventDiv.data('appointment_id'),
      title: onDeckEventDiv.data('title'),
      customerId: onDeckEventDiv.data('customer_id'),
      ticketId: onDeckEventDiv.data('ticket_id'),
      appointmentType: onDeckEventDiv.data('appointment_type'),
      status: onDeckEventDiv.data('status'),
      description: onDeckEventDiv.data('description'),
      color: onDeckEventDiv.data('color'),
      duration: onDeckEventDiv.data('duration'),
    }
    console.log('On Deck event: ', event);

    var index = getAppointmentTypeIndexById(event.appointmentType);
    console.log('index: ', index);
    var appointmentTypeName = appointmentTypes[index].name;
    console.log('appointmentTypeName: ', appointmentTypeName);

    $('#appointmentTypeDiv .status').attr('data-current_value', event.appointmentType);
    $('#appointmentTypeDiv .status').text(appointmentTypeName);
    $('#appointmentTitleInput').val(event.title);
    $('#appointmentId').text(event.id);
    $('#customerIdInput').val(event.customerId);
    $('#ticketIdInput').val(event.ticketId);
    $('#descriptionInput').val(event.description);
    $('#appointmentStatusDiv .btn').removeClass('active');

    var eventStatus = event.status;
    $('#appointmentStatusDiv .radio-btn').each(function() {
      // console.log($(this));
      if ( $(this).attr('data-appointment_status') == eventStatus ) {
        // console.log(eventStatus);
        $(this).parent().addClass('active');
      }
    });
  }

  // clear all data from the modal
  function clearModal() {
    console.log('clearing modal');
    $('#appointmentTypeDiv .status').attr('data-current_value', '');
    $('#appointmentTypeDiv .status').text('Appointment Type');
    $('#appointmentId').text('');
    $('#appointmentTitleInput').val('');
    $('#startInput').text('');
    $('#endInput').text('');
    $('#resourceInput').text('');
    $('#customerIdInput').val('');
    $('#ticketIdInput').val('');
    $('#descriptionInput').val('');
    $('#appointmentStatusDiv .btn').removeClass('active');
  }

  function showHiddenModalDivs() {
    $('#appointmentStartDiv').show();
    $('#appointmentEndDiv').show();
    $('#appointmentIdDiv').show();
    $('#appointmentResourceDiv').show();
    $("a[data-appointment_type='10']").show();
  }


  // send POST request to /api/appointments to save event to db
  function saveEvent(event) {
    $.ajax({
      type: 'POST',
      url: '/api/appointments',
      data: event,
      success: function(data) {console.log(data)},
      dataType: 'json'
    });
  }

  // send DELETE request to /api/appointments to delete event from db
  function deleteEvent(eventID) {
    console.log('ATTEMPTING TO DELETE EVENT ' + eventID);
    $.ajax({
      type: 'DELETE',
      url: '/api/appointments/' + eventID,
      data: eventID,
      success: function(data) {console.log(data)},
      dataType: 'json'
    });
  }

});
