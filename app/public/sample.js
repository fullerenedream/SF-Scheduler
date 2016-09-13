//  load this into the api view/template (.ejs file)
//  like so: script(src='/js/sample.js')

$(function() {
  $.getJSON('api', updateSample);

  $('.sample-form').submit(function(e){
    e.preventdefault();
    $.post('api', {
      name: $('#sample-form-name').val(),
      title: $('#sample-form-title').val(),
      message: $('#sample-form-message').val()
    }, updateSample);
  });

  $('.delete-me').on('click',function(e){
    $.ajax({
      url: 'api/' + e.target.id,
      type: 'DELETE',
      success: updateSample
    })
  });

  function updateSample(data){
    $.each(data,function(key,item){
      //output html including a delete button with class=.delete-me and id=key
    })
  }
})
