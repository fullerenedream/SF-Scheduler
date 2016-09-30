// I used this demo to get started:
// http://code.runnable.com/UfNTSnKMU1ZgAACt/how-to-add-calendar-using-jquery-and-fullcalendar
// some of the code and comments are still in here

$(document).ready(function() {

  todayDate = new Date().toISOString().substring(0,10);
  console.log(todayDate);

  // *** switch to this when JSON feed is set up
  var user_id = 1;
  var url = '/api/technician_schedules/' + String(user_id);
  console.log('url: ' + url);

  var allTheThings = $.getJSON('/api/technician_schedules', function(data){
    // once we have the response to the get request, call gotAllTheThings to draw the calendar
    gotAllTheThings(data);
  });

  function gotAllTheThings(data){
    console.log('inside gotAllTheThings');
    // draw the calendar with the data, in Agenda Day view
    agendaWeekView(data);
    // console.log(data);
  }


  /* initialize the calendar
  -----------------------------------------------------------------*/

  function agendaWeekView(allTheThings) {
    console.log('allTheThings.resources:')
    console.log(allTheThings.resources);
    console.log('inside agendaWeekView - allTheThings: ')
    console.log(allTheThings);
    var installersCalendar = $('#installers-fullcalendar').fullCalendar({
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
          installersCalendar.fullCalendar('renderEvent',
            {
              title: title,
              start: start,
              end: end,
              allDay: allDay
            },
            true // make the event "stick"
          );
        }
        installersCalendar.fullCalendar('unselect');
      },

      // resourceLabelText: 'Installers',
      // resources: allTheThings.resources,
      // events: allTheThings.events,

      // some demo tech working hours, displayed as events
      events: [
        {
          id: 'a',
          title: 'Sam',
          businessHours: {
              start: '07:00',
              end: '15:00'
          }
        },
        {
          id: 'b',
          title: 'Pat',
          businessHours: {
              start: '09:00',
              end: '17:00'
          }
        },
        {
          id: 'c',
          title: 'Kim',
          businessHours: {
              start: '11:00',
              end: '19:00'
          }
        }
      ]
    });
  }

});
