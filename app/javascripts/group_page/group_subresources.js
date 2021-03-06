var GroupSubresourcesView = CommonPlace.View.extend({
  template: "group_page/subresources",
  id: "group-subresources",
  
  initialize: function(options) {
    var self = this;
    this.account = options.account;
    this.group = options.model;
    this.groupPostsCollection = this.group.posts;
    this.groupMembersCollection = this.group.members;
    this.groupAnnouncementsCollection = this.group.announcements;
    this.groupEventsCollection = this.group.events;
    this.currentTab = options.current || "showGroupPosts";
    this.group.posts.on("sync", function() { self.switchTab("showGroupPosts"); }, this);
    this.group.members.on("sync", function() { self.switchTab("showGroupMembers"); }, this);
    this.group.announcements.on("sync", function() { self.switchTab("showAnnouncements"); }, this);
    this.group.events.on("sync", function() { self.switchTab("showEvents"); }, this);
  },

  afterRender: function() {
    this[this.currentTab]();
  },

  showGroupPosts: function() {
    var account = this.account;
    var wireView = new Wire({
      collection: this.groupPostsCollection,
      account: this.account,
      el: this.$(".group-posts .wire"),
      emptyMessage: "No posts here yet"
    });
    wireView.render();
  },

  showGroupMembers: function() {
    var account = this.account;
    var wireView = new Wire({
      collection: this.groupMembersCollection,
      account: this.account,
      el: this.$(".group-members .wire"),
      emptyMessage: "No members yet"
    });
    wireView.render();
  },

  showAnnouncements: function() {
    var account = this.account;
    var wireView = new Wire({
      collection: this.groupAnnouncementsCollection,
      account: this.account,
      el: this.$(".group-announcements .wire"),
      emptyMessage: "No announcements here yet"
    });
    wireView.render();
  },

  showEvents: function() {
    var account = this.account;
    var wireView = new Wire({
      collection: this.groupEventsCollection,
      account: this.account,
      el: this.$(".group-events .wire"),
      emptyMessage: "No events here yet"
    });
    wireView.render();
  },

  tabs: function() {
    return {
      showGroupPosts: this.$(".group-posts"),
      showGroupMembers: this.$(".group-members"),
      showAnnouncements: this.$(".group-announcements"),
      showEvents: this.$(".group-events")
    };
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
  }

});
