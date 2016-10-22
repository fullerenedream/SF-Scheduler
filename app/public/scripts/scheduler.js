// I used this demo to get started:
// http://code.runnable.com/UfNTSnKMU1ZgAACt/how-to-add-calendar-using-jquery-and-fullcalendar
// some of the code and comments are still in here

$(document).ready(function() {

  var todayDate = new Date().toISOString().substring(0,10);
  console.log(todayDate);

  // reset all bootstrap modals upon close
  $('.modal').on('hidden.bs.modal', function(e){
    $(this).removeData();
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



  // draw the calendar with all resources and events
  $.getJSON('/api/resources_and_events', function(data) {
    drawFullCalendar(data);
  });

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
      // *** this bit lets you click the calendar to create an event
      // *** TODO: modify this to work with bootstrap modal for making new event with click & drag ********************
      select: function(start, end, jsEvent, view, resource) {
        $('#fullCalModalNewEvent').modal();
        // populate the form with initial values (start, end, resource)


        calendar.fullCalendar('unselect');
      },

      resourceLabelText: 'Installers',

      // ************************ comment out for testing events without resources
      resources: calendarData.resources,
      // ************************ comment out for testing resources without events
      eventSources: calendarData.eventSources,

      eventRender: function(event, element) {
        // if event is Unassigned, allow overlap
        // TODO: bugfix - right now you can't drag an On Deck event straight onto
        // an Unassigned event - you have to drag it onto an empty calendar spot first
        // you ought to be able to drag an On Deck event straight onto the Unassigned
        // column, even if it's overlapping with a preexisting Unassigned event
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
      eventReceive: function(event) {
        console.log('eventReceive', event);
      },
      // called when an event (already on the calendar) is moved -
      // triggered when dragging stops and the event has moved to a *different* day/time
      eventDrop: function (event, delta, revertFunc, jsEvent, view) {
        console.log('eventDrop', event);

        // TODO: write saveCalendarEvent function
        // saveCalendarEvent(event);
      },
      eventClick: function (event, jsEvent, view) {
        // var newTitle = prompt('Enter a new title for this event', event.title);
        // if (newTitle) {
        //   // update event
        //   event.title = newTitle;
        //   // call the updateEvent method
        //   $('#fullcalendar').fullCalendar('updateEvent', event);
        // }

        // for bootstrap modal
        $('#modalTitle').html(event.title);
        $('#modalBody').html(event.description + '<br>Tech ID: ' + event.resourceId);
        $('#fullCalModal').modal();

      } // end of callback eventClick

      // other options go here...

    }); // end of var calendar
  } // end of function drawFullCalendar(calendarData)


  makeOnDeckSection(); // when On Deck events are loaded
  // drawFullCalendar(calendarData); // when calendarData is loaded


  // when 'submit' button is clicked on #fullCalModalNewEvent bootstrap modal
  // *** TODO: rewrite this so it makes sense in this scope
  // get the data from the form inputs, save the new event object to the db,
  // then draw the new event on the calendar
  $('#submitNewEventFromCalendar').click(function(){
    console.log('#submitNewEventFromCalendar was clicked!');

    var newEvent = new Object();

    // from click-and-drag selection on calendar
    newEvent.start = start;
    newEvent.end = end;
    newEvent.resourceId = resource.id;

    // from bootstrap modal
    $('#appointmentTypeDropdown li a').click(function() {
      console.log('dropdown item was selected!');
      newEvent.appointmentType = $(this).data('appointment_type');
      console.log('appointment type = ' + newEvent.appointmentType);
      $(this).parents(".btn-group").find('.selection').text($(this).text());
      $(this).parents(".btn-group").find('.selection').val($(this).text());
    });
    // $('#statusDropdown li a').click(function() {
    //   console.log('dropdown item was selected!');
    //   newEvent.status = $(this).data('status');
    //   console.log('status = ' + newEvent.status);
    //   $(this).parents(".btn-group").find('.selection').text($(this).text());
    //   $(this).parents(".btn-group").find('.selection').val($(this).text());
    // });

    newEvent.title = $('#appointmentTitle').val();
    newEvent.customerId = $('#customerId').val();
    newEvent.ticketId = $('#ticketId').val();
    newEvent.description = $('#description').val();
    console.log('JSON.stringify(new event):\n' + JSON.stringify(newEvent));
    calendar.fullCalendar('renderEvent', newEvent, true /* make the event "stick" */ );

    $('#fullCalModalNewEvent').modal('hide');

    // create event object to be stored in db
    // var postEvent = new Object();
    // postEvent.appointment_type = newEvent.appointmentType;
    // postEvent.title = newEvent.title;
    // postEvent.tech_id = newEvent.resourceId;
    // postEvent.appt_start_iso_8601 = newEvent.start;
    // postEvent.appt_end_iso_8601 = newEvent.end;
    // postEvent.customer_id = newEvent.customerId;
    // postEvent.ticket_id = newEvent.ticketId;
    // postEvent.description = newEvent.description;
    // console.log('JSON.stringify(postEvent):\n' + JSON.stringify(postEvent));

    // send POST request to /api/appointments to save postEvent to db
    // $.ajax({
    //   type: 'POST',
    //   url: '/api/appointments',
    //   data: postEvent,
    //   success: console.log(data),
    //   dataType:
    // })


    // $.post('/api/appointments', JSON.stringify(postEvent)).done(function(data) {
    //   console.log('data sent to /api/appointments: ' + data);
    // }, 'json');

    // $.post('/api/appointments', postEvent).done(function(data) {
    //   console.log('data sent to /api/appointments: ' + data);
    // });





  });


});
