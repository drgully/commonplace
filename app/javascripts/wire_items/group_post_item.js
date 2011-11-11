var GroupPostWireItem = WireItem.extend({
  template: "wire_items/post-item",
  tagName: "li",
  className: "wire-item",

  initialize: function(options) {
    this.account = options.account;
    var self = this;
    this.model.bind("destroy", function() { self.remove(); });
  },

  afterRender: function() {
    var repliesView = new RepliesView({ collection: this.model.replies(),
                                        el: this.$(".replies"),
                                        account: this.account
                                      });
    repliesView.render();
    this.model.bind("change", this.render, this);
    var self = this;
    repliesView.collection.bind("add", function() { self.render(); });
    this.$(".post-body").truncate({max_length: 450});
  },

  publishedAt: function() {
    return timeAgoInWords(this.model.get("published_at"));
  },

  avatarUrl: function() {
    return this.model.get("avatar_url");
  },

  title: function() {
    return this.model.get("title");
  },

  author: function() {
    return this.model.get("author");
  },

  body: function() {
      return this.model.get("body");
  },

  events: {
    "click div.group-post > .author > .person": "messageUser",
    "click .moreBody": "loadMore",
    "mouseenter": "showProfile",
    "click .editlink": "editGroupPost"
  },

  messageUser: function(e) {
    e && e.preventDefault();
    var user = new User({
      links: {
        self: this.model.get("links").author
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
  },

  isMore: function() {
    return !this.allwords;
  },

  loadMore: function(e) {
    e.preventDefault();
    this.allwords = true;
    this.render();
  },
  
  showProfile: function(e) {
    var group = new Group({
      links: { self: this.model.link("group") }
    });
    window.infoBox.showProfile(group);
  },

  canEdit: function() { return this.account.canEditGroupPost(this.model); },

  editGroupPost: function(e) {
    e && e.preventDefault();
    var formview = new PostFormView({
      model: this.model,
      template: "shared/group-post-edit-form"
    });
    formview.render();
  },
  
  group: function() { return this.model.get("group"); },
  
  groupUrl: function() { return this.model.get("group_url"); }

});
