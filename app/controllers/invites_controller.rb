class InvitesController < ApplicationController
  def new
    authorize!(:read, Post)
  end

  def create
    authorize!(:read, Post)
    unless params[:emails].present?
      params[:emails] = params[:invite][:email]
    end
    params[:emails].split(/,|\r\n|\n/).each do |email|
      unless User.exists?(:email => email)
        unless params[:message].present?
          params[:message] = params[:invite][:body] if params[:invite]
        end
        kickoff.deliver_user_invite(email, current_user, params[:message])
      end
    end
    redirect_to root_url
  end


end
