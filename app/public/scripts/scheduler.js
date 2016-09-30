// I used this demo to get started:
// http://code.runnable.com/UfNTSnKMU1ZgAACt/how-to-add-calendar-using-jquery-and-fullcalendar
// some of the code and comments are still in here

$(document).ready(function() {

  todayDate = new Date().toISOString().substring(0,10);
  console.log(todayDate);

  // *** switch to this when JSON feed is set up
  var user_id = 1;
  var url = '/api/resources_and_events/' + String(user_id);
  console.log('url: ' + url);

  var allTheThings = $.getJSON('/api/resources_and_events', function(data){
    // once we have the response to the get request, call gotAllTheThings to draw the calendar
    gotAllTheThings(data);
  });

  function gotAllTheThings(data){
    console.log('inside gotAllTheThings');
    // draw the calendar with the data, in Agenda Day view
    agendaDayView(data);
    // console.log(data);
  }


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

  function agendaDayView(allTheThings) {
    console.log('allTheThings.resources:')
    console.log(allTheThings.resources);
    console.log('inside agendaDayView - allTheThings: ')
    console.log(allTheThings);
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
      // TODO: make week and month views have dropdown to select one installer (or all installers)
      header: {
        left: 'prev,today,next',
        center: 'title',
        right: 'agendaDay,agendaWeek,month'
      },
      defaultView: 'agendaDay',

      selectable: true,
      selectHelper: true,
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
      resources: allTheThings.resources,
      eventSources: allTheThings.eventSources,
      // // some demo resources
      // resources: [
      //   {
      //     id: 'a',
      //     title: 'Sam',
      //     businessHours: {
      //         start: '07:00',
      //         end: '15:00'
      //     }
      //   },
      //   {
      //     id: 'b',
      //     title: 'Pat',
      //     businessHours: {
      //         start: '09:00',
      //         end: '17:00'
      //     }
      //   },
      //   {
      //     id: 'c',
      //     title: 'Kim',
      //     businessHours: {
      //         start: '11:00',
      //         end: '19:00'
      //     }
      //   }
      // ],
      // some demo appointments
      // events: [
      //   {
      //     id: '1',
      //     title: 'Full Install',
      //     ticketId: '101',
      //     description: 'Install wifi chez Joe Blow',
      //     start: todayDate + 'T10:00:00',
      //     end: todayDate + 'T12:00:00',
      //     resourceId: 'a',
      //     color: '#533A7B'
      //   },
      //   {
      //     id: '2',
      //     title: 'Service Call',
      //     ticketId: '95',
      //     description: "Replace broken thing at Mrs. Tiggywinkle's",
      //     start: todayDate + 'T14:30:00',
      //     end: todayDate + 'T15:30:00',
      //     resourceId: 'b',
      //     color: '#E05263'
      //   },
      //   {
      //     id: '3',
      //     title: 'Service Call',
      //     ticketId: '109',
      //     description: 'Fix router at the library',
      //     start: todayDate + 'T17:00:00',
      //     end: todayDate + 'T18:00:00',
      //     resourceId: 'c',
      //     color: '#E05263'
      //   }
      // ],
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
  // agendaDayView(allTheThings); // when allTheThings are loaded


});
