// I used this demo to get started:
// http://code.runnable.com/UfNTSnKMU1ZgAACt/how-to-add-calendar-using-jquery-and-fullcalendar
// some of the code and comments are still in here

$(document).ready(function() {

  var todayDate = new Date().toISOString().substring(0,10);
  console.log(todayDate);

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



  /* initialize the external events
  -----------------------------------------------------------------*/

  // it's also still using dummy data in index.ejs
  function makeOnDeckSection() {
    $('#external-events .fc-event').each(function() {

      // store data so the calendar knows to render an event upon drop
      $(this).data('event', {
        title: $.trim($(this).text()), // use the element's text as the event title
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
      now: todayDate,
      editable: true, // enable draggable events
      droppable: true, // this allows things to be dropped onto the calendar
      aspectRatio: 1.8,
      scrollTime: '06:00', // 6am is default scrollTime, but we may wish to change this
      allDaySlot: false,
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
      // *** TODO: make this actually work in a useful way
      select: function(start, end, allDay)
      {
        var title = prompt('Event Title:');
        if (title)
        {
          calendar.fullCalendar('renderEvent',
            {
              title: title,
              start: start,
              end: end,
              allDay: allDay
            },
            true // make the event "stick"
          );
        }
        calendar.fullCalendar('unselect');
      },

      resourceLabelText: 'Installers',

      // ************************ comment out for testing events without resources
      resources: calendarData.resources,
      // ************************ comment out for testing resources without events
      eventSources: calendarData.eventSources,


      eventRender: function(event, element) {
        if (event.description) {
          // add event description after event title
          var descriptionDiv = '<div>' + event.description + '</div>';
          $('div.fc-title', element).append(descriptionDiv);
        };
      },
      drop: function(date, jsEvent, ui, resourceId) {
        console.log('drop', date.format(), resourceId);
        // remove the element from the "Draggable Events" list
        $(this).remove();
      },
      // called when a proper external event is dropped
      eventReceive: function(event) {
        console.log('eventReceive', event);
      },
      // called when an event (already on the calendar) is moved
      eventDrop: function(event) {
        console.log('eventDrop', event);
      }
      // other options go here...
    });
  }

  makeOnDeckSection(); // when On Deck events are loaded
  // drawFullCalendar(calendarData); // when calendarData is loaded


});
