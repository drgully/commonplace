CommonPlace.render = function(name, params) {
  return Mustache.to_html(CommonPlace.templates[name], params,CommonPlace.templates);
};

var FeedPageRouter = Backbone.Router.extend({

  routes: {
    "/feeds/:slug": "show"
  },

  initialize: function(options) {
    var self = this;
    this.account = options.account;
    this.community = options.community;
    this.feedsList = new FeedsListView({ collection: options.feeds, el: $("#feeds-list") })
    this.feedsList.render();
    this.show(options.feed);
  },

  show: function(slug) {
    var self = this;
    $.getJSON("/api" + this.community.links.groups, function(groups) {
      self.feedsList.select(slug);
      $.getJSON("/api/feeds/" + slug, function(response) {
        var feed = new Feed(response);
        
        document.title = feed.get('name');
        
        var feedView = new FeedView({ model: feed, community: self.community, account: self.account, groups: groups });
        window.currentFeedView = feedView;
        feedView.render();
        
        $("#feed").replaceWith(feedView.el);
      });
    });
  }
});

var FeedView = CommonPlace.View.extend({
  template: "feed_page/feed",
  id: "feed",
  initialize: function(options) {
    var self = this;
    this.community = options.community;
    this.account = options.account;
    this.groups = options.groups;
    var feed = this.model;
    var resourceNav, resource, actions, profile, about, header;

    profile = new FeedProfileView({ model: feed });
    about = new FeedAboutView({ model: feed });
    header = new FeedHeaderView({ model: feed, account: self.account });
    resource = new FeedSubResourcesView({ feed: feed });
    resourceNav = resourceNav = new FeedNavView({ model: feed });
    actions = feedActionsView = new FeedActionsView({ feed: feed, 
                                                      groups: this.groups,
                                                      account: self.account,
                                                      community: self.community
                                                    });

    resourceNav.bind("switchTab", function(tab) { resource.switchTab(tab);});

    this.subViews = [profile, about, header, resource, resourceNav, actions];
  },

  afterRender: function() {
    var self = this;
    _(this.subViews).each(function(view) { 
      view.render();
      self.$("#" + view.id).replaceWith(view.el);
    });
  },

  isOwner: function() {
    return this.account.isFeedOwner(this.model);
  }

});

var FeedHeaderView = CommonPlace.View.extend({
  template: "feed_page/feed-header",
  id: "feed-header",
  initialize: function(options) { 
    this.account = options.account; 
  },

  events: {
    "click a.subscribe": "subscribe",
    "click a.unsubscribe": "unsubscribe"
  },

  isSubscribed: function() {
    return this.account.isSubscribedToFeed(this.model);
  },

  isOwner: function() {
    return this.account.isFeedOwner(this.model);
  },

  editURL: function() {
    return "/feeds/" + this.model.id + "/edit";
  },

  subscribe: function(e) {
    var self = this;
    e.preventDefault();
    this.account.subscribeToFeed(this.model, function() { self.render(); });
  },
  
  unsubscribe: function(e) {
    var self = this;
    e.preventDefault();
    this.account.unsubscribeFromFeed(this.model, function() { self.render(); });
  },

  feedName: function() { return this.model.get('name'); }
     
});

var FeedProfileView = CommonPlace.View.extend({
  template: "feed_page/feed-profile",
  id: "feed-profile",
  
  events: {
    "click button.send-message": "openMessageModal"
  },
  
  openMessageModal: function() {
    var view = new FeedMessageFormView({ feed: this.model });
    view.render();
    return this;
  },

  avatarSrc: function() { return this.model.get("links").avatar.large; },
  address: function() { return this.model.get("address"); },
  phone: function() { return this.model.get("phone"); },
  website: function() { return this.model.get("website"); }
  
});

var FeedMessageFormView = CommonPlace.View.extend({
  template: "feed_page/feed-message-form",
  className: "feed-message-modal",

  events: {
    "click form a.cancel": "exit",
    "submit form": "send"
  },
  
  initialize: function(options) {
    var self = this;
    this.feed = this.options.feed; 
    this.$container = $("body");
    this.$shadow = $("<div/>", { 
      id: "modal-shadow",
      click: function() { self.exit(); }
    });
  },

  afterRender: function() {
    this.$container.append(this.el);
    this.$container.append(this.$shadow);
    this.$("textarea").autoResize();
    this.centerEl();
  },

  centerEl: function() {
    var $el = $(this.el);
    var $window = $(window);
    
    $el.css({ top: ($window.height() - $el.height()) / 2,
              left: ($window.width() - $el.width()) / 2 
            });
  },

  send: function(e) {
    e.preventDefault();
    var self = this;
    $.ajax({
      contentType: "application/json",
      url: "/api" + this.feed.links.messages,
      type: "post",
      data: JSON.stringify({ 
        subject: this.$("[name=subject]").val(),
        body: this.$("[name=body]").val()
      }),
      dataType: "json",
      success: function(message) { 
        self.exit();
      }
    });
  },

  exit: function(e) {
    e && e.preventDefault();
    this.$shadow.remove();
    $(this.el).remove();
  }
});

var FeedsListView = CommonPlace.View.extend({
  template: "feed_page/feeds-list",

  feeds: function() {
    return this.collection;
  },

  select: function(slug) {
    this.$("li").removeClass("current");
    this.$("li[data-feed-slug=" + slug + "]").addClass("current");
  }

});

var FeedNavView = CommonPlace.View.extend({
  template: "feed_page/feed-nav",
  id: "feed-nav",
  events: {
    "click a": "navigate"
  },

  initialize: function(options) {
    this.current = options.current || "showAnnouncements";
  },
  
  navigate: function(e) {
    e.preventDefault();
    this.current = $(e.target).attr('data-tab');
    this.trigger('switchTab', this.current);
    this.render();
  },

  classIfCurrent: function() {
    var self = this;
    return function(text) {
      return this.current == text ? "current" : "";
    };
  }
});

var FeedActionsView = CommonPlace.View.extend({
  id: "feed-actions",
  template: "feed_page/feed-actions",
  events: {
    "click #feed-action-nav a": "navigate",
    "submit .post-announcement form": "postAnnouncement",
    "submit .post-event form": "postEvent",
    "submit .invite-subscribers form.invite-by-email": "inviteByEmail",
    "change .post-label-selector input": "toggleCheckboxLIClass"
  },

  initialize: function(options) {
    this.feed = options.feed;
    this.groups = options.groups;
    this.account = options.account;
    this.community = options.community;
    this.postAnnouncementClass = "current";
  },
  
  afterRender: function() {
    $("input.date", this.el).datepicker({dateFormat: 'yy-mm-dd'});
    $('input[placeholder], textarea[placeholder]').placeholder();
    this.$("textarea").autoResize();
  },

  navigate: function(e) {
    var $target = $(e.target);
    $target.addClass("current").siblings().removeClass("current");
    $(this.el).children(".tab").removeClass("current").filter("." + $target.attr('href').slice(2)).addClass("current");
    e.preventDefault();
  },

  toggleCheckboxLIClass: function(e) {
    $(e.target).closest("li").toggleClass("checked");
  },

  postAnnouncement: function(e) {
    var $form = $(e.target);
    var self = this;
    e.preventDefault();
    this.feed.announcements.create(
      { title: $("[name=title]", $form).val(),
        body: $("[name=body]", $form).val(),
        groups: $("[name=groups]:checked", $form).map(function() { return $(this).val(); }).toArray()
      }, {
        success: function() { self.render(); }
      });
  },

  postEvent: function(e) {
    var self = this;
    var $form = $(e.target);
    e.preventDefault();
    this.feed.events.create(
      { title:   $("[name=title]", $form).val(),
        about:   $("[name=about]", $form).val(),
        date:    $("[name=date]", $form).val(),
        start:   $("[name=start]", $form).val(),
        end:     $("[name=end]", $form).val(),
        venue:   $("[name=venue]", $form).val(),
        address: $("[name=address]", $form).val(),
        tags:    $("[name=tags]", $form).val(),
        groups:  $("[name=groups]:checked", $form).map(function() { return $(this).val(); }).toArray()
      }, {
        success: function() { self.render(); }
      });
  },

  avatarUrl: function() { return this.feed.get('links').avatar.thumb; },


  time_values: _.flatten(_.map(["AM", "PM"],
                               function(half) {
                                 return  _.map(_.range(1,13),
                                               function(hour) {
                                                 return _.map(["00", "30"],
                                                              function(minute) {
                                                                return String(hour) + ":" + minute + " " + half;
                                                              });
                                               });
                               })),

  inviteByEmail: function(e) {
    var self = this;
    var $form = $(e.target);
    e.preventDefault();
        $.ajax({
          contentType: "application/json",
          url: "/api" + this.feed.links.invites,
          data: JSON.stringify({ emails: _.map($("[name=emails]", $form).val().split(/,|;/), 
                                               function(s) { return s.replace(/\s*/,""); }),
                                 message: $("[name=message]", $form).val()
                               }),
          type: "post",
          dataType: "json",
          success: function() { self.render(); }});
  }

});

var FeedSubResourcesView = CommonPlace.View.extend({
  template: "feed_page/feed-subresources",
  id: "feed-subresources",
  initialize: function(options) {
    this.feed = options.feed;
    this.announcementsCollection = this.feed.announcements;
    this.eventsCollection = this.feed.events;
    this.currentTab = options.current || "showAnnouncements";
    this.feed.events.bind("add", function() { this.switchTab("showEvents"); }, this);
    this.feed.announcements.bind("add", function() { this.switchTab("showAnnouncements"); }, this);
  },

  afterRender: function() {
    this[this.currentTab]();
  },

  showAnnouncements: function() {
    var self = this;
    this.announcementsCollection.fetch({
      success: function(announcements) {
        announcements.each(function(announcement) {
          var view = new AnnouncementItemView({model: announcement});
          view.render();
          self.$(".feed-announcements ul").append(view.el);
        });
      }
    });
  },

  showEvents: function() {
    var self = this;
    this.eventsCollection.fetch({
      success: function(events) {
        events.each(function(event) {
          var view = new EventItemView({model: event});
          view.render();
          self.$(".feed-events ul").append(view.el);
        });
      }
    });
  },

  tabs: function() {
    return { showAnnouncements: this.$(".feed-announcements"),
             showEvents: this.$(".feed-events") };
  },

  classIfCurrent: function() {
    var self = this;
    return function(text) {
      return text == self.currentTab ? "current" : "";
    };
  },

  switchTab: function(newTab) {
    this.tabs()[this.currentTab].hide();
    this.currentTab = newTab;
    this.tabs()[this.currentTab].show();
    this.render();
  },

  feedName: function() { return this.feed.get('name'); }
});

var FeedAboutView = CommonPlace.View.extend({
  template: "feed_page/feed-about",
  id: "feed-about",
  about: function() { return this.model.get('about'); }
});

