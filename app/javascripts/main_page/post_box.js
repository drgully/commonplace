
var PostBox = CommonPlace.View.extend({
  template: "main_page.post-box",
  id: "post-box",
  
  events: {
    "click .navigation li": "clickTab"
  },
  
  afterRender: function() {
    this.temp = {}
    this.showTab("nothing");
  },
  
  clickTab: function(e) {
    e.preventDefault();
    // DETERMINE WHAT TO DO WITH URLS WHEN WE CLICK
    this.switchTab($(e.target).attr("data-tab"), e);
    $("#first_post_tooltip").hide();
  },
  
  switchTab: function(tab, e) {
    if (this.$("form input").length) {
      this.temp = {
        title: this.$("form input[name=title]").val(),
        body: this.$("form textarea[name=body]").val() ||
              this.$("form textarea[name=about]").val()
      }
    }
    this.showTab(tab, e);
  },
  
  showTab: function(tab, e) {
    var view;
    
    this.$("li.current").removeClass("current");
    
    this.$("li." + tab).addClass("current");
    view = this.tabs[tab]();
    
    view.render();
    this.$("form").replaceWith(view.el);
    
    if (this.temp) {
      this.$("form input[name=title]").val(this.temp.title);
      this.$("form textarea[name=body]").val(this.temp.body);
      this.$("form textarea[name=about]").val(this.temp.body);
    }
    
    CommonPlace.layout.reset();
  },
  
  tabs: {
    nothing: function() { return new PostForm(); },
    event: function() { return new EventForm(); },
    post: function() { return new PostForm({ category: "neighborhood" }); },
    publicity: function() { return new PostForm({ category: "publicity" }); },
    offers: function() { return new PostForm({ category: "offers" }); },
    help: function() { return new PostForm({ category: "help" }); },
    other: function() { return new PostForm({ category: "other" }); },
    group: function() { return new GroupPostForm(); }
  },
  
  groups: function() {
    return CommonPlace.community.get("groups");
  }
  
  
});

