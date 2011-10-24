//= require json2
//= require showdown
//= require jquery
//= require jquery-ui
//= require actual
//= require underscore
//= require config
//= require feature_switches
//= require placeholder
//= require time_ago_in_words
//= require scrollTo
//= require mustache
//= require backbone
//= require autoresize
//= require dropkick
//= require truncator
//= require views
//= require_tree ../templates/shared
//= require_tree ../templates/main_page
//= require info_boxes
//= require models
//= require en
//= require college
//= require main_page/app
//= require info_boxes
//= require wires
//= require wire_items
//= require_tree ./main_page


function setPostBoxTop() { 
  if ($(window).scrollTop() < 60) { 
    $("#post-box").css({top: 85}); 
  } else { 
    $("#post-box").css({top: 15}); 
  } 
}

function setProfileBoxBottom() {
  if ($(document).height() - $(window).scrollTop() - $(window).height() < 65) {
    $("#info-box").css({bottom: 75});
  } else {
    $("#info-box").css({bottom: 15});
  }
}

function setProfileBoxTop() {
  var $postBox = $("#post-box");
  $("#info-box").css({
    top: $postBox.outerHeight() + parseInt($postBox.css("top"),10) + 10
  });
}

function setProfileBoxInfoUpperHeight() {
  $("#info-upper").css({
    height: $("#info-box").height() - 
      $("#info-box h2").outerHeight() - 
      $("#info-box form").outerHeight() -
      $("#info-box ul.filter").outerHeight() - 40
  });
}

$(function() {

  if (Features.isActive("fixedLeftColumn")) {
    $(window).scroll(function() {
      setPostBoxTop();
      setProfileBoxBottom();
      setProfileBoxTop();
      setProfileBoxInfoUpperHeight();
    });
    $("body").addClass("fixedLeftColumn");
  }
  
});
