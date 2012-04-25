require 'resque'
require 'resque_scheduler'

uri = if Rails.env.development?
        URI.parse("localhost:6379")
      elsif ENV["REDISTOGO_URL"].present?
        URI.parse(ENV["REDISTOGO_URL"])
      else
        ""
      end

if uri.present?
  Resque.redis = Redis.new(:host => uri.host, 
                           :port => uri.port, 
                           :password => uri.password, 
                           :thread_safe => true)
else
  Resque.redis = MockRedis.new
end
Resque.schedule = YAML.load_file(File.join(File.dirname(__FILE__), '../resque_schedule.yml'))
