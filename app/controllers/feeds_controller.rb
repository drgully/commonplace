class FeedsController < CommunitiesController
  before_filter :load, :except => [:index, :show]
  authorize_resource
  
  def index
    if params[:letter].present?
      @items = current_community.feeds.all(:conditions => ["name ILIKE ?", params[:letter].slice(0,1) + "%"])
    else
      @items = current_community.feeds.all(:order => "name ASC")
    end
  end

  def show
    render :profile, :layout => false
  end
  
  def delete
    render :layout => 'application'
  end

  def destroy
    if can?(:destroy, @feed)
      @feed.destroy
    end
    redirect_to root_url
  end

  def edit_owner
    render :layout => 'application'
  end

  def update_owner
    if can?(:update, @feed) 
      if user = User.find_by_email(params[:email])
        @feed.user = user
        @feed.save
        redirect_to root_url
      else
        @error = true
        render :edit_owner, :layout => 'application'
      end
    else
      redirect_to root_url
    end
  end
      

  def profile
    render :layout => false
  end

  def new
    render :layout => "feed_registration"
  end

  def create
    @feed = current_community.feeds.new(params[:feed])
    @feed.user = current_user
    if @feed.save
      redirect_to new_profile_feed_url(@feed)
    else
      render :new, :layout => "feed_registration"
    end
  end

  def new_profile
    @feed = Feed.find(params[:id])
    render :layout => "feed_registration"
  end

  def create_profile
    @feed = Feed.find(params[:id])
    if @feed.update_attributes(params[:feed])
      redirect_to "/pages/#{@feed.slug.blank? ? @feed.id : @feed.slug}"
    else
      render :new_profile, :layout => "feed_registration"
    end
  end

  def edit
    render :layout => 'application'
  end

  def update
    if @feed.update_attributes(params[:feed])
      redirect_to profile_feed_url(@feed)
    else
      render :edit, :layout => 'application'
    end
  end
  
  protected
  def load
    @feed = 
      case params[:id]
      when /^\d+$/
        Feed.find(params[:id])
      when /[^\d]/
        params[:action] = "profile"
        Feed.find_by_slug_and_community_id(params[:id], current_community.id)
      else
        Feed.new
      end
  end
end
