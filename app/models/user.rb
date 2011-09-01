class User < ActiveRecord::Base
  #track_on_creation
  include Geokit::Geocoders

  def self.post_receive_options
    ["Live", "Three a Day", "Daily", "Never"]
  end
  
  attr_accessor :crop_x, :crop_y, :crop_w, :crop_h
  after_update :reprocess_avatar, :if => :cropping?

  acts_as_authentic do |c|
    c.login_field :email
    c.validates_uniqueness_of_login_field_options({:message => "This email has already been taken."})
    #c.merge_validates_length_of_login_field_options({:allow_nil => true,:message => "This email is too short"})
    c.merge_validates_format_of_login_field_options({:with => "/^[\S]+$/", :message => "Please enter your email without spaces"})
    c.validate_email_field = false
    c.validate_login_field = false
    #c.require_password_confirmation = true
    c.ignore_blank_passwords = true
    #c.validates_length_of_password_field_options({:minimum => 1, :message => "Please create a password."})
    c.validate_password_field = false
    c.perishable_token_valid_for 1.hour
  end

  geocoded_by :normalized_address

  belongs_to :community
  belongs_to :neighborhood  

  def organizer_data_points
    OrganizerDataPoint.find_all_by_organizer_id(self.id)
  end

  before_validation :geocode, :if => :address_changed?
  before_validation :place_in_neighborhood, :if => :address_changed?

  validates_presence_of :community
  validates_presence_of :address, :on => :create, :unless => :is_transitional_user, :message => "Please provide a street address so CommonPlace can verify that you live in our community."
  validates_presence_of :address, :on => :update
  

  validates_presence_of :first_name, :unless => :is_transitional_user 
  validate :validate_first_and_last_names, :unless => :is_transitional_user

  validates_presence_of :neighborhood, :unless => :is_transitional_user
  validates_uniqueness_of :facebook_uid, :allow_nil => true 

  scope :between, lambda { |start_date, end_date| 
    { :conditions => 
      ["? <= created_at AND created_at < ?", start_date.utc, end_date.utc] } 
  }

  scope :today, { :conditions => ["created_at between ? and ?", DateTime.now.utc.beginning_of_day, DateTime.now.utc.end_of_day] }

  scope :up_to, lambda { |end_date| { :conditions => ["created_at <= ?", end_date.utc] } }

  scope :logged_in_since, lambda { |date| { :conditions => ["last_login_at >= ?", date.utc] } }

  def facebook_user?
    authenticating_with_oauth2? || facebook_uid
  end
  
  def validate_password?
    if facebook_user?
      return false
    end
    return true
  end

  validates_presence_of :email
  validates_uniqueness_of :email

  # HACK HACK HACK TODO: This should be in the database schema, or slugs for college towns should ALWAYS be the domain suffix
  validates_format_of :email, :with => /^([^\s]+)umw\.edu/, :if => :college?

  def college?
    self.community.is_college
  end

  validates_presence_of :first_name, :last_name

  def cropping?
    !crop_x.blank? && !crop_y.blank? && !crop_w.blank? && !crop_h.blank?
  end
  
  def after_oauth2_authentication
    json = oauth2_access.get('/me')
    
    if user_data = JSON.parse(json)
      self.full_name = user_data['name']
      self.facebook_uid = user_data['id']
      self.email = user_data['email']
    end
  end
  
  def send_to_facebook
    redirect_to_oauth2
  end

  def self.find_by_email(email)
    where("LOWER(users.email) = ?", email.downcase).first
  end

  has_many :attendances, :dependent => :destroy

  has_many :events, :through => :attendances
  has_many :posts, :dependent => :destroy
  has_many :group_posts, :dependent => :destroy
  has_many :announcements, :dependent => :destroy, :as => :owner, :include => :replies

  has_many :replies, :dependent => :destroy


  has_many :subscriptions, :dependent => :destroy
  accepts_nested_attributes_for :subscriptions
  has_many :feeds, :through => :subscriptions, :uniq => true

  has_many :memberships, :dependent => :destroy
  accepts_nested_attributes_for :memberships
  has_many :groups, :through => :memberships, :uniq => true

  has_many :managable_feeds, :class_name => "Feed"
  has_many :direct_events, :class_name => "Event", :as => :owner, :include => :replies, :dependent => :destroy

  has_many :referrals, :foreign_key => "referee_id"
  has_many :messages, :dependent => :destroy

  has_many :received_messages, :as => :messagable, :class_name => "Message", :dependent => :destroy

  has_many :mets, :foreign_key => "requester_id"
  
  has_many :people, :through => :mets, :source => "requestee"

  has_attached_file(:avatar,                    
                    {:styles => { 
                        :thumb => {:geometry => "100x100", :processors => [:cropper]},
                        :normal => {:geometry => "120x120", :processors => [:cropper]},
                        :large => {:geometry => "200x200", :processors => [:cropper]},
                        :croppable => "400x400>"
                      },
                      :default_url => "/avatars/missing.png"
                    }.merge(Rails.env.development? || Rails.env.test? ? 
                            { :path => ":rails_root/public/system/users/:id/avatar/:style.:extension", 
                              :storage => :filesystem,
                              :url => "/system/users/:id/avatar/:style.:extension"
                            } : { 
                              :storage => :s3,
                              :s3_protocol => "https",
                              :bucket => "commonplace-avatars-#{Rails.env}",
                              :path => "/users/:id/avatar/:style.:extension",
                              :s3_credentials => {
                                :access_key_id => ENV['S3_KEY_ID'],
                                :secret_access_key => ENV['S3_KEY_SECRET']
                              }
                            }))
  


  def avatar_geometry(style = :original)
    @geometry ||= {}
    path = (avatar.options[:storage]==:s3) ? avatar.url(style) : avatar.path(style)
    @geometry[style] ||= Paperclip::Geometry.from_file(path)
  end

  scope :receives_weekly_bulletin, :conditions => {:receive_weekly_digest => true}

  scope :receives_daily_digest, :conditions => {:post_receive_method => "Daily"}

  scope :receives_posts_live, :conditions => {:post_receive_method => "Live"}

  scope :receives_posts_live_limited, :conditions => {:post_receive_method => "Three a Day"}


  def inbox
    (self.received_messages + self.messages).sort {|m,n| n.updated_at <=> m.updated_at }.select {|m| !m.archived }
  end


  def validate_first_and_last_names
    errors.add(:full_name, "CommonPlace requires people to register with their first \& last names.") if first_name.blank? || last_name.blank?
  end 
  
  def daily_subscribed_announcements
    self.subscriptions.all(:conditions => "receive_method = 'Daily'").
      map(&:feed).map(&:announcements).flatten
  end

  def suggested_events
    []
  end

  def search(term)
    User.all
  end
  

  
  def full_name
    [first_name,middle_name,last_name].select(&:present?).join(" ")
  end

  def full_name=(string)
    split_name = string.to_s.split(" ")
    self.first_name = split_name.shift.to_s.capitalize
    self.last_name = split_name.pop.to_s.capitalize
    self.middle_name = split_name.map(&:capitalize).join(" ")
    self.full_name
  end

  def name
    full_name
  end

  def wire
    if new_record?
      community.announcements + community.events
    else
      subscribed_announcements + community.events + neighborhood.posts
    end.sort_by do |item|
      ((item.is_a?(Event) ? item.start_datetime : item.created_at) - Time.now).abs
    end
  end
  
  def role_symbols
    if new_record?
      [:guest]
    else
      [:user]
    end
  end

  def feed_list
    feeds.map(&:name).join(", ")
  end

  def group_list
    groups.map(&:name).join(", ")
  end

  def place_in_neighborhood
    if self.community.is_college
      self.neighborhood = self.community.neighborhoods.select { |n| n.name == self.address }.first
    else
      self.neighborhood = self.community.neighborhoods.near(self.to_coordinates, 15).first || self.community.neighborhoods.first
    end
    unless self.neighborhood
      errors.add :address, I18n.t('activerecord.errors.models.user.address',
                                  :community => self.community.name)
    end
  end
  
  def is_facebook_user
    facebook_uid.present?
  end
  
  def facebook_avatar_url
    "https://graph.facebook.com/" + self.facebook_uid.to_s + "/picture/?type=large"
  end
  
  def avatar_url(style_name = nil)
    if Rails.env.development?
      return "/avatars/missing.png"
    else
      if is_facebook_user && !self.avatar.file?
        facebook_avatar_url
      else
        self.avatar.url(style_name || self.avatar.default_style)
      end
    end
  end

  def value_adding?
    (self.posts.size >= 1 || self.announcements.size >= 1 || self.events.size >= 1)
  end

  def normalized_address
    if address.match(/#{self.community.name}/i)
      address
    else
      address + ", #{self.community.name}"
    end
  end

  def generate_point
    if self.generated_lat.present? and self.generated_lng.present?
    else
      loc = MultiGeocoder.geocode("#{self.address}, #{self.community.zip_code}")
      self.generated_lat = loc.lat
      self.generated_lng = loc.lng
      self.save
    end
    point = Hash.new
    point['lat'] = self.generated_lat
    point['lng'] = self.generated_lng
    point
  end

  def self.received_reply_to_object_in_last(repliable_type, days_ago)
    # We expect repliable_type to be Post
    if repliable_type == 'Post'
      item = Post
    elsif repliable_type == 'Event'
      item = Event
    elsif repliable_type == 'Announcement'
      item = Announcement
    end
    user_ids = []
    Reply.between(days_ago.days.ago, Time.now).select {|r| r.repliable_type == repliable_type}.map(&:repliable_id).uniq.each do |i| user_ids << item.find(i).owner end
    user_ids
  end

  def has_received_message_within(time_ago)
    messages.between(time_ago, Time.now).select { |m| m.messagable_id == self.id and m.messagable_type == "User" }.present?
  end

  def self.received_no_reply_in_last(start_time)
    user_ids = []
    post_ids = []
    User.all.each do |u|
      unless u.has_received_message_within(start_time)
        u.posts.between(start_time, Time.now).each do |p|
          unless p.replies.present?
            post_ids << p.id
          end
        end
      end
    end
    post_ids.uniq
  end

  searchable do
    string :first_name
    string :last_name
    string :about
    string :interest_list
    string :offer_list
    string :address
  end
  #handle_asynchronously :solr_index

  private
  def reprocess_avatar
    avatar.reprocess!
  end

  def is_transitional_user
    transitional_user
  end

end
