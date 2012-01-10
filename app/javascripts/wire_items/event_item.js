var EventWireItem = WireItem.extend({
  template: "wire_items/event-item",
  tagName: "li",
  className: "wire-item",

  initialize: function(options) {
    var self = this;
    this.model.bind("destroy", function() { self.remove(); });
  },

  afterRender: function() {
    var repliesView = new RepliesView({ collection: this.model.replies(),
                                        el: this.$(".replies"),
                                        account: CommonPlace.account
                                      });
    repliesView.render();
    this.model.bind("change", this.render, this);
    this.$(".event-body").truncate({max_length: 450});
    if (this.thanked())
      this.set_thanked(false, this);
  },

  short_month_name: function() { 
    var m = this.model.get("occurs_on").match(/(\d{4})-(\d{2})-(\d{2})/);
    return this.monthAbbrevs[m[2] - 1];
  },

  day_of_month: function() { 
    var m = this.model.get("occurs_on").match(/(\d{4})-(\d{2})-(\d{2})/);
    return m[3]; 
  },

  publishedAt: function() { return timeAgoInWords(this.model.get('published_at')); },

  title: function() { return this.model.get('title'); },

  author: function() { return this.model.get('author'); },

  first_name: function() { return this.model.get('first_name'); },

  venue: function() { return this.model.get('venue'); },

  address: function() { return this.model.get('address'); },


  time: function() { return this.model.get('starts_at'); },

  body: function() {
      return this.model.get("body");
  },

  numThanks: function() {
      return this.model.get("thanks").length;
  },

  monthAbbrevs: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"],

  events: {
    "click .editlink": "editEvent",
    "mouseenter": "showProfile",
    "click .event > .author": "messageUser",
    "click .thank-link": "thank"
  },

  editEvent: function(e) {
    e && e.preventDefault();
    var formview = new EventFormView({
      model: this.model,
      template: "shared/event-edit-form"
    });
    formview.render();
  },

  canEdit: function() { return CommonPlace.account.canEditEvent(this.model); },

  isMore: function() {
    return !this.allwords;
  },

  loadMore: function(e) {
    e.preventDefault();
    this.allwords = true;
    this.render();
  },

  showProfile: function(e) {
    window.infoBox.showProfile(this.model.author());
  },
  
  isFeed: function() { return this.model.get("owner_type") == "Feed"; },
  
  feedUrl: function() { return this.model.get("feed_url"); },
  
  messageUser: function(e) {
    if (!this.isFeed()) {
      e && e.preventDefault();
      var user = new User({
        links: {
          self: this.model.get("user_url")
        }
      });
      user.fetch({
        success: function() {
          var formview = new MessageFormView({
            model: new Message({messagable: user})
          });
          formview.render();
        }
      });
    }
  },

  thank: function() {
    var self = this;
    $.ajax({
      url: "/api/events/" + this.model.get("id") + "/thank",
      type: "POST",
      success: function() {
        self.$(".thank_count").html(self.numThanks() + 1);
      }
    });
  }

});
