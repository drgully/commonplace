class ApplicationController < ActionController::Base
  #include CentralLogger::Filter
  protect_from_forgery
  helper :all
  include FeedsHelper
  helper_method :current_community
  helper_method :current_neighborhood
  helper_method 'logged_in?'
  helper_method 'xhr?'
  helper_method :facebook_session
  helper_method :api, :serialize
  
  before_filter :domain_redirect, :set_process_name_from_request, :set_locale, :set_api_token
  after_filter :unset_process_name_from_request

  rescue_from CanCan::AccessDenied do |exception|
    store_location
    redirect_to "/users/sign_in"
  end

  def kickoff
    @kickoff ||= KickOff.new
  end

  def after_sign_out_path_for(resource_or_scope)
    "/users/sign_in"
  end

  protected

  def set_api_token
    if logged_in?
      cookies['authentication_token'] = current_user.authentication_token
    end
  end

  def serialize(thing)
    Serializer::serialize(thing).to_json.html_safe
  end

  def cp_client
    @_cp_client ||= CPClient.new(:host => "http://commonplace.api", :api_key => current_user.authentication_token)
  end
  
  def set_process_name_from_request
    $0 = request.path[0,16] 
  end   
  
  def unset_process_name_from_request
    $0 = request.path[0,15] + "*"
  end  
  
  def translate_with(options = {})
    @default_translate_options ||= {}
    @default_translate_options.merge!(options)
  end

  def set_template_format
    if xhr?
      response.template.template_format = :json
    end
  end

  def domain_redirect
    return unless Rails.env.production?
    return if request.host == "commonplace.herokuapp.com"
    case request.host

    when %r{^www\.ourcommonplace\.com$}
      return

    when %r{^assets\.}
      return

    when %r{^ourcommonplace\.com$}
      redirect_to "https://www.ourcommonplace.com#{request.fullpath}", :status => 301
      return

    when %r{^(?:www\.)?([a-zA-Z]+)\.ourcommonplace\.com$}
      if request.path == "/" || request.path == ""
        redirect_to "https://www.ourcommonplace.com/#{$1}", :status => 301
      else
        redirect_to "https://www.ourcommonplace.com#{request.fullpath}", :status => 301
      end

    when %r{^(?:www\.)?commonplaceusa.com$}
      case request.path
      when %r{^/$}
        redirect_to "https://www.ourcommonplace.com/about", :status => 301
      else
        redirect_to "https://www.ourcommonplace.com#{request.fullpath}", :status => 301
      end
    end
    
  end

  def current_community
    @_current_community ||= 
      if params[:community]
        Community.find_by_slug(params[:community])
      elsif logged_in?
        current_user.community
      else
        nil
      end

    if @_current_community
      params[:community] = @_current_community.slug
      translate_with :community => @_current_community.name
      Time.zone = @_current_community.time_zone    
    end
    @_current_community 
  end

  def current_neighborhood
    if logged_in?
      if current_user.admin? && params[:neighborhood_id].present?
        current_user.neighborhood = Neighborhood.find(params[:neighborhood_id])
        current_user.save!
      end
      @current_neighborhood ||= current_user.neighborhood
    end
  end

  def store_location
    session["user_return_to"] = request.fullpath
  end

  def logged_in?
    user_signed_in?
  end

  def set_locale
    if current_community.present?
      I18n.default_locale = :en
      I18n.locale = current_community.locale
    end
  end

end
