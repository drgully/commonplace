class Message < ActiveRecord::Base
  #track_on_creation

  
  belongs_to :user
  belongs_to :messagable, :polymorphic => true
  validates_presence_of :subject, :body, :user, :messagable

  has_many :replies, :as => :repliable, :order => :created_at

  scope :today, :conditions => ["created_at between ? and ?", DateTime.now.at_beginning_of_day, DateTime.now]
  
  def long_id
    IDEncoder.to_long_id(self.id)
  end
  
  def self.find_by_long_id(long_id)
    Message.find(IDEncoder.from_long_id(long_id))
  end

  
  def most_recent_body
    if replies.empty?
      self.body
    else
      replies.last.body
    end
  end
  
end
