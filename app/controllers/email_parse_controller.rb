class EmailParseController < ApplicationController
  def parse
    user = User.find_by_email(params[:from])
    post = Post.find(params[:to].match(/post-(\d+)/)[1].to_i)
    if user && post
      Reply.create(:body => params[:text],
                   :repliable => post,
                   :user => user)
    end
    render :nothing => true
  end
      
      
  #   reply = Reply.new(
  #   # Pull the data from the e-mail
  #   text = params[:text]
  #   from = params[:from]
  #   to = params[:to]
  #   # Assume that the user is sending an e-mail to post-ID@commonplaceusa.com
  #   post_id = to.gsub(/[post\-,\@commonplaceusa\.com]/,'').to_i
    
  #   # Ensure that the user exists
  #   user = User.find_by_email(from)
  #   if (!user)
  #     # Ideally, this will send an e-mail back, complaining
  #     return
  #   end
    
  #   reply = Reply.new(:body => text, :repliable_id => post_id, :user_id => user.id)
  #   reply.repliable = Post.find(post_id)
  #   if !reply.save!
  #     puts "ERROR SAVING!"
  #   end
  #   puts reply.inspect
    
  #   render :layout => false
  # end
end
