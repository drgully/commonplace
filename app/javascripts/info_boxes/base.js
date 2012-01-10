var InfoListItem = CommonPlace.View.extend({
  template: "main_page.info-list",
  tagName: "li",
  events: {
    "click": "switchProfile"
  },

  avatarUrl: function() { return this.model.get('avatar_url'); },
  
  title: function() { return this.model.get("name"); },

  about: function() {
    var longText = this.model.get("about");
    if (longText) {
      var shortText = longText.match(/\b([\w]+[\W]+){6}/);
      return (shortText) ? shortText[0] : longText;
    }
    return "";
  },

  switchProfile: function(e) {
    $(this.el).siblings().removeClass("current");
    $(this.el).addClass("current");
    e.preventDefault();
    window.infoBox.showList(window.infoBox.getSchema(), this.model);
  }
  
});

var InfoBox = CommonPlace.View.extend({
  id: "info-box",
  template: "main_page.info-box",
  $profile: function() { return this.$("#profile"); },
  $list: function() { return this.$("#info-list"); },
  $profile_none: function() { return this.$("#profile-area > .none"); },
  $list_none: function() { return this.$("#info-list-area > .none"); },

  events: {
    "click .filter-tab": "switchTab",
    "click .remove-search": "removeSearch",
    "submit form": "searchFormSubmit",
    "keyup input.search": "filterBySearch"
  },

  searchFormSubmit: function(e) { e.preventDefault(); },

    // Prevents duplicate ajax requests. the throttler must be re-created for every load.
    nextPageTrigger: function() {
        var self = this;
        this.nextPageThrottled = _.once(function() {
            self.nextPage();
        });
    },

    afterRender: function() {
      var self = this;
      this.currentCollection = {};
      this.currentQuery = "";
      this.page = 0;
      this.showProfile(this.options.account);

      self.nextPageTrigger();

      this.$("#info-list-area > ul").scroll(function() {
        // start loading when the scrollbar is halfway down
      if ($(this).scrollTop() > (this.scrollHeight / 2)) {
        self.nextPageThrottled();
      } 
    });

  },


  isAccount: function(model) {
    return model &&
      (model.get("schema") == "users" || model.get("schema") == "account") &&
      model.id === this.options.account.id;
  },

  showProfile: function(model) {
    var self = this;

    this.$(".remove-search").hide();
    this.currentQuery = "";

    model.fetch({
      success: function() {
        if (self.isAccount(model)) { model = self.options.account; }

        self.renderProfile(model);

        self.currentQuery = "";
        self.$("form > input").val(self.currentQuery);

        self.currentCollection = self.collectionFor(model);
        self.currentCollection.fetch({
          success: function() {
            self.renderList(self.currentCollection);
          }
        });
      }
    });
  },

  showList: function(schema, model) {
    var self = this;

    //var partial = this.currentQuery ? this.options.community.search : this.options.community;
    //var collection = (schema == "account") ? partial.users : partial[schema];
    
    var collection = this.currentQuery ? this.config(schema).search : this.config(schema).collection;

    if (schema == "account") {
      if ( (model && this.isAccount(model)) || !model) {
        model = this.options.account;
      }
    }

    this.page = 0;

    collection.fetch({
      data: { query: this.currentQuery },
      success: function() {
        if (collection.length === 0) {
          self.$(".remove-search").removeClass("not-empty");
          self.$(".remove-search").addClass("empty");
          self.changeSchema(schema);
          self.renderNone();
          if (self.currentQuery) {
            self.$list().empty();
          } else {
            //collection = self.options.community;
            //collection = (schema == "account") ? collection.users : collection[schema];
            
            collection = self.config(schema).collection;

            collection.fetch({
              success: function() {
                self.showFetchedList(collection, model);
              }
            });
          }
        } else {
          self.$(".remove-search").addClass("not-empty");
          self.$(".remove-search").removeClass("empty");
          self.$(".none").hide();
          self.showFetchedList(collection, model);
        }
      }
    });
  },

  showFetchedList: function(collection, model) {
    this.renderList(collection);
    this.currentCollection = collection;

    var firstIsAccount = this.isAccount(collection.first());
    var self = this;

    if ((firstIsAccount && collection.length == 1)) {
      model = this.options.account;
    } else {
      if (model) {
        model = this.isAccount(model) ? this.options.account : model;
      } else {
        model = firstIsAccount ? collection.at(1) : collection.first();
      }
    }
    model.fetch({
      success: function() {
        self.renderProfile(model);
      }
    });
  },

  nextPage: function() {
    var collection = this.currentCollection;
      if (collection.length < 25) { return; }
      this.page = this.page + 1;
      var self = this;
      collection.fetch({
          data: {
              query: this.currentQuery,
              page: this.page
          },
          success: function() {
              self.renderList(collection, "append");
              self.nextPageTrigger();
          },
          error: function() {
              self.nextPageTrigger();
          }
      });
  },

  renderProfile: function(model) {
    if (model == this.currentModel) { return; }
    this.$profile().show();
    this.$profile_none().hide();
    var profile = this.profileBoxFor(model);
    profile.render();
    this.$profile().replaceWith(profile.el);
    this.changeSchema(model.get("schema"));
    this.currentModel = model;
  },
  
  renderNone: function() {
    this.$profile().hide();
    this.$profile().hide();
    this.page = 0;
    var schema = (this.getSchema() == "account" ? "users" : this.getSchema());
    var box = new {
      "users" : UserNoneBox,
      "feeds" : FeedNoneBox,
      "groups" : GroupNoneBox,
      "account" : UserNoneBox
    }[schema]({ community: this.options.community });
    box.render();
    this.$profile_none().replaceWith(box.el);
    this.$profile_none().show();
    this.$list_none().show();
  },

  renderList: function(collection, options) {
    var self = this;
    this.$list_none().hide();
    if (collection != this.currentCollection) {
      this.$("#info-list-area > ul").scrollTop(0);
    }
    if (options != "append") { this.$list().empty(); }
    collection.each(function (model) {
      var item = new InfoListItem({
        model: model,
        account: self.options.account
      });
      item.render();
      self.$list().append(item.el);
    });
  },

  changeSchema: function(schema) {
    this.$(".filter-tab").removeClass("current");
    this.$("." + schema + "-filter").addClass("current");
  },

  profileBoxFor: function(model) {
    return new (this.config(model.get('schema')).profileBox)({ 
      model: model, account: 
      this.options.account 
    });
  },

  collectionFor: function(model) {
    return this.config(model.get('schema')).collection;
  },

  searchFor: function(model) {
    return this.config(model.get("schema")).search;
  },

  config: function(type) {
    return {
      "account": { profileBox: AccountProfileBox, 
                   collection: this.options.community.featuredUsers,
                   search: this.options.community.search.users
                 },
      "users":  { profileBox: UserProfileBox, 
                 collection: this.options.community.featuredUsers,
                 search: this.options.community.search.users
               },
      "groups": { profileBox: GroupProfileBox, 
                 collection: this.options.community.groups,
                 search: this.options.community.search.groups
               },
      "feeds": { profileBox: FeedProfileBox, 
                collection: this.options.community.featuredFeeds,
                search: this.options.community.search.feeds
              } 
    }[type];    
  },

  switchTab: function(e) {
    e && e.preventDefault();
    this.showList(this.getSchema($(e.target)));
  },

  filterBySearch: _.debounce(function(e) {
    e && e.preventDefault();
    query = this.$("input.search").val();
    if (query) {
      this.$("#info-list-area").addClass("searching");
      this.$(".remove-search").show();
      this.$(".remove-search").text(query);
      this.currentQuery = query;
      this.showList(this.getSchema());
    } else { this.removeSearch(); }
  }, 500),

  removeSearch: function(e) {
    e && e.preventDefault();
    this.$("#info-list-area").removeClass("searching");
    this.$(".remove-search").hide();
    this.currentQuery = "";
    this.$("form > input").val("");
    this.showList(this.getSchema());
  },

  getSchema: function(el) {
    el = el ? el : $(".filter-tab.current");
    return el.attr("href").split("#")[1];
  }

});

var Profile = CommonPlace.View.extend({
  id: "profile",
  
  aroundRender: function(render) {
    this.model.fetch({
      success: render
    });
  }
});
