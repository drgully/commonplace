var WireItem = CommonPlace.View.extend({

  set_thanked: function(increment, scope) {
    if (increment) {
      scope.$(".thank_count").html(scope.numThanks() + 1);
    }
    scope.$(".thank-link").html("Thanked!");
    scope.$(".thank-link").addClass("thanked-post");
  },

  thanked: function() {
    var thanks = _.map(this.model.get("thanks"), function(thank) { return thank.name; });
    if (_.include(thanks, CommonPlace.account.get("name"))) {
      this.set_thanked(false, this);
    }
  },

  thank: function() {
    this.$(".thank-share .current").removeClass("current");
    if (this.thanked())
      return;
    var self = this;
    $.ajax({
      url: "/api/" + this.model.get("schema") + "/" + this.model.get("id") + "/thank",
      type: "POST",
      success: function() {
        self.set_thanked(true, self);
        self.showThanks();
      }
    });
  },
  
  showThanks: function(e) {
    if (e) { e.preventDefault(); }
    if (!_.isEmpty(this.model.get("thanks"))) {
      this.removeFocus();
      var thanksView = new ThanksView({ model: this.model,
                                        el: this.$(".replies")
                                      });
      thanksView.render();
      this.state = "thanks";
    }
  },

  share: function(e) {
    if (e) { e.preventDefault(); }
    this.state = "share";
    this.removeFocus();
    this.$(".share-link").addClass("current");
    var shareView = new ShareView({ model: this.model,
                                    el: this.$(".replies"),
                                    account: CommonPlace.account
                                  });
     shareView.render();
   },

  reply: function(e) {
    if (e) { e.preventDefault(); }
    if (this.state != "reply") {
      this.removeFocus();
      this.$(".reply-link").addClass("current");
      var repliesView = new RepliesView({ collection: this.model.replies(),
                                      el: this.$(".replies"),
                                      account: CommonPlace.account
                                    });
      repliesView.render();
    }
    this.$(".reply-text-entry").focus();
    this.state = "reply";
  },
  
  removeFocus: function() {
    this.$(".thank-share .current").removeClass("current");
  }
});
