angular.module("fireblog")
  .constant("firebaseUrl", "https://amber-fire-1284.firebaseio.com/posts")
  .factory(
    "posts",
    function ($firebase, firebaseUrl) {
      var ref = new Firebase(firebaseUrl);

      return $firebase(ref);
    }
  )
  .provider("markdownConverter", function () {
    return {
      $get: function () {
        return new Showdown.converter();
      }
    };
  })
  .directive(
    "markdown",
    function ($sanitize, markdownConverter) {
      return {
        restrict: "E",
        link: function (scope, element, attrs) {
          scope.$watch(attrs.content, function (newVal) {
            var html = newVal ? markdownConverter.makeHtml(newVal) : '';
            element.html(html);
          });
        }
      };
    }
  )
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/posts/");

    $stateProvider
      .state("posts", {
        url:          "/posts/",
        abstract:     true,
        controller:   "PostCtrl",
        controllerAs: "post",
        template:     "<ui-view></ui-view>"
      })
      .state("posts.list", {
        url: "",
        templateUrl: "posts/list.html"
      })
      .state("posts.detail", {
        url: ":key",
        controller: "PostDetailCtrl",
        controllerAs: "detail",
        resolve: {
          postData: function ($firebase, firebaseUrl, $stateParams) {
            var ref = new Firebase(firebaseUrl + "/" + $stateParams.key);

            return $firebase(ref).$asObject().$loaded();
          }
        },
        templateUrl: "posts/detail.html"
      })
      .state("posts.new", {
        url: "new/",
        templateUrl: "posts/new.html"
      })
      .state("posts.edit", {
        url: "edit/:key",
        resolve: {
          postData: function ($firebase, firebaseUrl, $stateParams) {
            var ref = new Firebase(firebaseUrl + "/" + $stateParams.key);

            return $firebase(ref).$asObject().$loaded();
          }
        },
        controller: "PostEditCtrl",
        controllerAs: "postEditor",
        templateUrl: "posts/edit.html"
      });
  })
  .controller("PostEditCtrl", function (postData, $state) {
    this.postData = postData;

    this.update = function () {
      this.postData.$save();
    };

    this.destroy = function () {
      this.postData.$destroy();
      $state.go('posts.list');
    };
  })
  .controller("PostDetailCtrl", function (postData, $stateParams) {
    this.postData = postData;
    this.key = $stateParams.key;
  })
  .controller("PostCtrl", function (posts) {
    this.posts = posts.$asArray();

    this.addPost = angular.bind(this, function (isValid, data) {
      this.posts.$add(data);
    });
  });
