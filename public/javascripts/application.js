
$.sammy("body")
  .get("#/", setList)
  .get("#close", function() {
    $.sammy("body").setLocation("#/posts");
    $("#modal").html("");
  })

  .setLocationProxy(new Sammy.CPLocationProxy($.sammy('body')));

$(document).ready(function() {

  $.sammy("body").run()

  $('ul#wire').accordion({'header': 'a.item_body', 
                          'active': false,
                          'collapsible': true, 
                          'autoHeight': false,
                         });

  $('body').click(function(e) {
    if (e.pageX < (($('body').width() - $('#wrap').width()) / 2)) {
      history.back();
    }
  });
  
  $('a[data-nohistory]').live('click', function(e) {
    e.preventDefault();
    $.sammy("body").runRoute("get",$(this).attr('href'));
  });

  renderMaps();

  window.onscroll = setInfoBoxPosition;
  
  
  
  $('.disabled_link').attr('title', "Coming soon!").tipsy({gravity: 'n'});

});
