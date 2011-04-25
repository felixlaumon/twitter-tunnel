$(function(){
	
	/*  Tweet Model
		Stores single tweet
		
		Attributes:
		id:			(int) id of the tweet from twitter
		username: 	(string) username of the tweet
		content:	(string) content of the tweet
		date:		(int) UNIX timestamp of the tweet
		parent: 	(id) id to another Tweet
		
	*/
	
	window.Tweet = Backbone.Model.extend({
		
		initialize: function(){
			// throw error if any empty attributes (except parent)
			// validate parent id too?
		}
		
	})
	
	/*	Tweets Collection
		Store list of Tweet
		
		Properties:
		keyword:	(string) search term for this tweet list
	*/
	
	window.TweetCollection = Backbone.Collection.extend({
		
		model: Tweet,
		localStorage: new Store("tweets-"+this.cid),
		
		comparator: function(tweet){
			return tweet.get("id");
		},
		
		findSubgraph: function(id){
			var that = this;
			
			var reverseBFS = function(tobj){
				var recurThis = arguments.callee;
				if (tobj){
					var parentId = tobj.toJSON().parent;
					parentNodes = that.filter(function(t){ return t.get("id") == parentId });
					var parentOfParentNodes = _.map(parentNodes, function(t){
						return recurThis(t);
					});
					return _.flatten([tobj,parentOfParentNodes]);
				}
			}
			
			console.log(reverseBFS(id));
			
			var findRoot = function(id){
				rootID = id;
				while (rootID.toJSON().parent != null){
					rootID = that.filter(function(t){
						return rootID.get("parent") == t.get("id") 
					})[0]; // assume only one parent per node
				}
				return rootID;
			}
			
			//var root = findRoot(startNode);
			// console.log(root);
			
			// not working
			var bfs = function(root){
				var queue = [ root ];
				var results = [];
				while (queue.length != 0){
					var node = queue.splice(0,1)[0].get("id"); // actually dequeue
					console.log(node);
					results.push( node ); // actually enqueue
					var newNodes = that.filter(function(t){ return t.get("parent") ==  node });
					console.log(newNodes);
					queue.push(  );
				}
				return _.flatten(results);
			}
			
			// var results = bfs(root);
			// console.log(results);
			
		}
		
	})
	
	
	/*  Keyword Model
		Stores tweets of some keyword and the state
		
		Attributes:
			content: 	(string) inputted keyword
			active: 	(boolean) whether the keyword should be visualized
			color: 		(string) css color for the nodes
			tweets: 	(id) Collection of tweets related to the keyword
		
		Method:
			(void) toggle: toggle the state of `active`
		
	*/
	
	window.Keyword = Backbone.Model.extend({
		
		initialize: function(){
			if (!this.get("keyword")){
				throw "cannot initialize: empty keyword";
			} else {
				var tweets = new TweetCollection;
				tweets.keyword = this.get("keyword");
				this.set({tweets: tweets});
				// show loading notification
				this.fetchTweets();
			}
		},
		
		toggle: function(){
			this.save({'active': !this.get('active')});
		},
		
		clear: function(){
			this.destroy();
			this.view.remove();
		},
		
		fetchTweets: function() {
			// getJSON some URL
			var json = [
				{
					"id": 1,
					"username": "coolguy",
					"content": "something",
					"date": 1299995252,
					"parent": null
				},
				{
					"id": 2,
					"username": "someone",
					"content": "blah",
					"date": 1299996521,
					"parent": 1
				},
				{
					"id": 3,
					"parent": 1
				},
				{
					"id": 4,
					"parent": 3
				},
				{
					"id": 5,
					"parent": 4
				},
				{
					"id": 6,
					"parent": 3
				},
				{
					"id": 7,
					"parent": null
				}
			];
			
			
			
			// move to getJSON callback
			var tweetCollection = this.get("tweets");
			_.map(json, function(t){
				var tweet = new Tweet(t);
				tweetCollection.add(tweet);
				// console.log(tweet.toJSON());
			});
			// hide loading notification
			
			// end: move to getJSON callback
			
			// tweetCollection.findSubgraph( tweetCollection.at(6) );
			
			
		}
		
	});
	
	
	/*	Keyword Collection
		Store list of `keyword` models
		Presistent Data through localStorage
	*/
	
	window.KeywordCollection = Backbone.Collection.extend({
		model: Keyword,
		localStorage: new Store("keywords")
	});
	
	/*	Keyword View
		View for single keyword. Handles interaction of one keyword
		
	*/
	
	window.KeywordView = Backbone.View.extend({
		
		tagName: "li",
		className: "keywords",
		
		template: _.template("<%= keyword %><span class='delete-keyword'>x</span>"),
		
		events: {
			"click" : "toggleActive",
			"click span.delete-keyword" : "deleteKeyword"
		},
		
		initialize: function(){
			_.bindAll(this, 'render');
			this.model.view = this;
		},
		
		render: function(){
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		toggleActive: function(){
			if (this.model.get('active')){
				// tell tunnelView to hide relate nodes
			}
			else{
				// tell tunnelView to show relate nodes
			}
			this.model.toggle();
			$(this.el).toggleClass('disabled');
		},
		
		// Try to delete the data from model first
		deleteKeyword: function(){
			this.model.clear();
		},
		
		// 
		remove: function(){
			// tell tunnelView to remove related nodes
			$(this.el).slideUp('fast');
		}
		
	});
	
	window.KeywordCollectionView = Backbone.View.extend({
		
		el: $('#keyword-container'),
		
		events: {
			"keypress #keyword-input-text": "addKeyword",
			"click #add-keyword": "showInputBox",
			"blur #keyword-input-text": "hideInputBox"
		},
		
		initialize: function(){
			this.Keywords = new KeywordCollection;
			
			_.bindAll(this, 'addOne', 'addAll', 'render');
			this.input = this.$('#keyword-input-text');
			
			this.Keywords.bind('add', this.addOne);
			this.Keywords.bind('refresh', this.addAll);
			this.Keywords.bind('all', this.render);
			
			// comment out the below line to turn off persistant storage
			this.Keywords.fetch();
			
		},
		
		showInputBox: function(){
			$('#add-keyword').hide();
			$('#add-keyword-container').show();
			this.input.focus();
		},
		
		hideInputBox: function(){
			this.input.val('');
			$('#add-keyword').show();
			$('#add-keyword-container').hide();
		},
		
		// render one keyword model to view
		addOne: function(keyword){
			var view = new KeywordView({model: keyword});
			
			$(view.render().el).hide()
				.appendTo(this.$("#keywords-list")).fadeIn('fast');
		},
		
		// based on addOne. render all keyword models to view.
		addAll: function() {
	    	this.Keywords.each(this.addOne);
	    },
		
		// default attribute values for keyword
		newAttributes: function(){
			return {
				keyword: this.input.val(),
				active: true
			};
		},
		
		addKeyword: function(e){
			if (e.keyCode != 13) return;
			console.log('adding keyword');
			if(this.Keywords.create(this.newAttributes())){
				this.hideInputBox();
				
				// Tell LineChartView to load the new tweets data
				
				// Tell TunnelView to load the tweets
			}
		}
		
	});
	
	
	
});