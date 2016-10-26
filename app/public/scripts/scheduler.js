// I used this demo to get started:
// http://code.runnable.com/UfNTSnKMU1ZgAACt/how-to-add-calendar-using-jquery-and-fullcalendar
// some of the code and comments are still in here

$(document).ready(function() {

  var todayDate = new Date().toISOString().substring(0,10);
  console.log(todayDate);

  // make dropdown menus work
  $('.dropdown-menu li > a').click(function(){
    console.log('dropdown item was selected!');
    $('.status').text($(this).text());
    console.log( $('.status').text() );
    $('.status').attr('data-current_value', $(this).attr('data-appointment_type') );
    console.log('dropdown current value: ' + $('.status').attr('data-current_value'));
  });

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


  // draw the calendar with all resources and events
  function loadCalendar() {
    $.getJSON('/api/resources_and_events', function(data) {
      $('#fullcalendar').replaceWith('<div id="fullcalendar"></div>');
      drawFullCalendar(data);
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


  // // draw the calendar with all appointments but no resources (for testing)
  // $.getJSON('/api/appointments', function(data) {
  //   drawFullCalendar(data);
  // });



  /* initialize the external events
  -----------------------------------------------------------------*/

  // dummy external events
  var externalEvent1 = new Object();
  externalEvent1.appointmentType = 1;
  externalEvent1.title = 'Install at the Boathouse';
  externalEvent1.customerId = 20;
  externalEvent1.ticketId = 120;
  externalEvent1.status = 0;
  externalEvent1.description = 'Say hi to Henry Fuller';

  var externalEvent2 = new Object();
  externalEvent2.appointmentType = 2;
  externalEvent2.title = 'Fix router for Grandma Jenkins';
  externalEvent2.customerId = 21;
  externalEvent2.ticketId = 121;
  externalEvent2.status = 0;
  externalEvent2.description = 'Good cookies, avoid lemonade';

  var externalEvent3 = new Object();
  externalEvent3.appointmentType = 1;
  externalEvent3.title = 'Install at Harris farm';
  externalEvent3.customerId = 22;
  externalEvent3.ticketId = 122;
  externalEvent3.status = 0;
  externalEvent3.description = 'on the green barn';

  var externalEventArray = [externalEvent1, externalEvent2, externalEvent3];


  function makeOnDeckSection() {

    // generate html for external events for makeOnDeckSection to operate on
    for (var i = 0; i < externalEventArray.length; i++) {
      var onDeckEvent = "<div class='fc-event' data-title='" + externalEventArray[i].title +
                        "' data-customer_id='" + externalEventArray[i].customerId +
                        "' data-ticket_id='" + externalEventArray[i].ticketId +
                        "' data-appointment_type='" + externalEventArray[i].appointmentType +
                        "' data-status='" + externalEventArray[i].status +
                        "' data-description='" + externalEventArray[i].description +
                        "'>" + externalEventArray[i].title +"</div>";
      $('#external-events').append(onDeckEvent);
    }

    $('#external-events .fc-event').each(function() {
      // store data so the calendar knows to render an event upon drop
      $(this).data('event', {
        title: $(this).data('title'),
        customer_id: $(this).data('customer_id'),
        ticket_id: $(this).data('ticket_id'),
        appointment_type: $(this).data('appointment_type'),
        status: $(this).data('status'),
        description: $(this).data('description'),
        stick: true // maintain when user navigates (see docs on the renderEvent method)
      });

      // make the event draggable using jQuery UI
      $(this).draggable({
        zIndex: 999,
        revert: true,      // will cause the event to go back to its
        revertDuration: 0  //  original position after the drag
      });

    });
  }

  /* initialize the calendar
  -----------------------------------------------------------------*/
  // draw the calendar with all resources and events
  loadCalendar();

  function drawFullCalendar(calendarData) {
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
      navLinks: true,
      eventOverlap: false,
      // TODO: change buttons so 'today' shows today's date, get rid of title
      header: {
        left: 'prev,today,next',
        center: 'title',
        right: 'agendaDay,agendaWeek,month'
      },
      defaultView: 'agendaDay',
      selectable: true,
      selectHelper: true,

      // click & drag on the calendar to create an event
      select: function(start, end, jsEvent, view, resource) {
        var start_ISO8601 = start.format('YYYY-MM-DD[T]HH:mm:ss');
        var end_ISO8601 = end.format('YYYY-MM-DD[T]HH:mm:ss');
        // set the modal title and cancel/close button
        $('#modalTitle').text('Create Appointment');
        $('#modalCancelOrClose').text('Cancel');
        // populate the form with initial values
        $('#startInput').attr('data-start_input', start_ISO8601).attr('placeholder', start_ISO8601);
        $('#endInput').attr('data-end_input', end_ISO8601).attr('placeholder', end_ISO8601);
        $('#resourceInput').attr('data-resource_input', resource.id).attr('placeholder', resource.id);
        $('#appointmentStatusDropdown').attr('data-current_value', 0).attr('text', 'Status');

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

      eventRender: function(event, element) {
        // if event is Unassigned, allow overlap
        if (event.resourceId == 0) {
          event.overlap = true;
        }
        // add event description after event title
        if (event.description) {
          var descriptionDiv = '<div>' + event.description + '</div>';
          $('div.fc-title', element).append(descriptionDiv);
        };
        // add event notes after event title
        if (event.notes) {
          var notesDiv = '<div>' + event.notes + '</div>';
          $('div.fc-title', element).append(notesDiv);
        };
      },
      drop: function(date, jsEvent, ui, resourceId) {
        console.log('drop', date.format(), resourceId);
        // remove the element from the "Draggable Events" list
        $(this).remove();
      },

      // called when an external element, containing event data, is dropped on the calendar
      // TODO: write eventReceive functionality
      // TODO: bugfix - right now you can't drag an On Deck event straight onto
      // an Unassigned event - you have to drag it onto an empty calendar spot first.
      // you ought to be able to drag an On Deck event straight onto the Unassigned
      // column, even if it's overlapping with a preexisting Unassigned event
      eventReceive: function(event) {
        console.log('eventReceive', event);
        // set the modal title and cancel/close button
        $('#modalTitle').text('Create Appointment');
        $('#modalCancelOrClose').text('Cancel');
        // summon the modal
        $('#fullCalModal').modal();
      },

      // called when an event (already on the calendar) is moved -
      // triggered when dragging stops and the event has moved to a *different* day/time
      // *********   TODO: finish adjusting eventData to make sense in eventDrop *************************************
      eventDrop: function (event, delta, revertFunc, jsEvent, view) {
        console.log('eventDrop', event);

        // set the modal title and cancel/close button
        $('#modalTitle').text('View/Edit Appointment');
        $('#modalCancelOrClose').text('Cancel');

        // populate the form with initial values from click & drag (start, end, resource)
        // $('#startInput').attr('data-start_input', start_ISO8601).attr('placeholder', start_ISO8601);
        // $('#endInput').attr('data-end_input', end_ISO8601).attr('placeholder', end_ISO8601);
        // $('#resourceInput').attr('data-resource_input', resource.id).attr('placeholder', resource.id);

        // var eventData = {
        //   appointment_type: event.appointment_type,
        //   title: event.title,
        //   tech_id: event.tech_id,
        //   appt_start_iso_8601: event.appt_start_iso_8601,
        //   appt_end_iso_8601: event.appt_end_iso_8601,
        //   customer_id: event.customer_id,
        //   ticket_id: event.ticket_id,
        //   description: event.description,
        //   appointment_id: event.appointment_id
        // }

        // summon the modal
        $('#fullCalModal').modal();
        // saveEvent(eventData);
      },

      // TODO: write eventClick functionality
      eventClick: function (event, jsEvent, view) {
        console.log('eventClick', event);
        // set the modal title and cancel/close button
        $('#modalTitle').text('View/Edit Appointment');
        $('#modalCancelOrClose').text('Close');

        // summon the modal
        $('#fullCalModal').modal();

      } // end of callback eventClick


      // other fullCalendar options go here...


    }); // end of var calendar
  } // end of function drawFullCalendar(calendarData)


  makeOnDeckSection(); // when On Deck events are loaded
  // drawFullCalendar(calendarData); // when calendarData is loaded


  // when 'Save' button is clicked on #fullCalModal bootstrap modal
  $('#modalSave').click(function(){
    console.log('modal Save button was clicked!');

    var newEvent = new Object();

    // data from bootstrap modal
    newEvent.appointment_type = $('#appointmentTypeDiv .status').attr('data-current_value');
    newEvent.title = $('#appointmentTitleInput').val();
    newEvent.tech_id = $('#resourceInput').data('resource_input');
    newEvent.appt_start_iso_8601 = $('#startInput').data('start_input');
    newEvent.appt_end_iso_8601 = $('#endInput').data('end_input');
    newEvent.customer_id = $('#customerIdInput').val();
    newEvent.ticket_id = $('#ticketIdInput').val();
    newEvent.description = $('#descriptionInput').val();

    console.log('JSON.stringify(new event):\n' + JSON.stringify(newEvent));

    var eventData = {
      appointment_type: newEvent.appointment_type,
      title: newEvent.title,
      tech_id: newEvent.tech_id,
      appt_start_iso_8601: newEvent.appt_start_iso_8601,
      appt_end_iso_8601: newEvent.appt_end_iso_8601,
      customer_id: newEvent.customer_id,
      ticket_id: newEvent.ticket_id,
      description: newEvent.description
    }
    console.log('JSON.stringify(eventData): ' + JSON.stringify(eventData));

    saveEvent(eventData);

    // hide modal once newEvent is created
    $('#fullCalModal').modal('hide');

    loadCalendar();
  });


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

});
