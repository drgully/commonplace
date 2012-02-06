class API
  class Stats < Base
    get "/" do
      # Return global statistics aggregate
      stats_by_community = {}
      Community.all.each do |community|
        stats_by_community[community.slug] = StatisticsAggregator.generate_hashed_statistics_for_community(community)
      end
      #stats_by_community["global"] = {}
      serialize stats_by_community
    end

    get "/community/:id" do |id|
      community = Community.find(id)
      # Return community statistics aggregate
      serialize StatisticsAggregator.generate_hashed_statistics_for_community(community)
    end
  end
end
