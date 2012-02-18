class BootstrapsController < ApplicationController

  # these actions give just a little bit of information to the browser before
  # handing things over to Backbone.js

  layout false
  
  before_filter :authenticate_user!, :except => :registration

  def community 
    EventSender.user_visited_main_page
    redirect_to "/#{current_community.slug}"
  end

  def feed ; end

  def group ; end

  def application ; end

  def registration ; end

  def organizer_app ; end

end
