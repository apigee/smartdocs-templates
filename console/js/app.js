(function(){
    $(".navbar-nav li a").click(function (event) {
        $("html, body").animate({scrollTop: 0}, "slow");
        var toggle = $(".navbar-toggle").is(":visible");
        if (toggle) {
            $(".navbar-collapse").collapse('hide');
        }
    });
    var app = angular.module('site', ['ngRoute']);
    app.controller('PageController', ['$scope', '$location', function($scope, $location) {
        this.page = this.title = $location.path().substring(1);
        this.setActive = function(setPage) {
            this.page = setPage;
        };
        this.isActive = function(checkPage) {
            return this.page === checkPage;
        };
    }]);
    app.controller('ConsoleController', ['$scope', '$http', '$location', function($scope, $http, $location) {
        var that = this;

        //TEMP LOADER -- TAKE THIS OUT
        var tempJsonUrl = $location.absUrl();
        var consoleSplit = tempJsonUrl.substr(0, tempJsonUrl.lastIndexOf('/console')) + '/assets/sample.json';
        $("#jsonUrl").val(consoleSplit);

        this.loadDef = function(defUrl) {
            console.log('trying to grab '+defUrl);
            $http.get(defUrl)
                .success(function(data, status, headers, config) {
                    //console.log(config.url);
                    //$location.search('api', config.url);
                    //that.showDef(data);
                    console.log('yes');
                })
                .error(function(data, status, headers, config) {
                    //that.grabDef();
                    console.log('nope');
                })
        };
        this.showDef = function(theDef) {
            console.log(theDef);
            that.apiDef = theDef;
            $("#method_list").html("");
            $("#method_pulldown").html("");
            var methodMap = {
                GET : "info",
                PUT : "warning",
                POST : "success",
                DELETE : "danger"
            }
/*
            angular.forEach(theDef.paths, function(pathValue, pathKey) {
                angular.forEach(pathValue, function(methodValue, methodKey) {
                    var upperKey = angular.uppercase(methodKey);
                    var dataString = 'data-methodKey="'+methodKey+'" data-pathKey="'+pathKey+'"';
                    var nameString = upperKey+' '+pathKey;
                    var anchorClass = "list-group-item";
                    if (methodMap.hasOwnProperty(upperKey)) anchorClass += " list-group-item-"+methodMap[upperKey];
                    $("#method_list").append('<a class="'+anchorClass+'" href="#" '+dataString+'><span class="label label-default">'+upperKey+'</span>'+pathKey+'</a>');
                    $("#method_pulldown").append('<option '+dataString+' value="'+methodKey+'_'+pathKey+'">'+nameString+'</option>');
                });
            });
*/
        };
        this.grabDef = function() {
            console.log('grabbing def');
            var jsonUrl = ($location.search().hasOwnProperty('api')) ? $location.search().api : false;
            if (jsonUrl) {
                that.loadDef(jsonUrl);
            } else {
                $("#notificationModal").modal('show').find("button.js-loadDef").click(function(event) {
                    that.loadDef($.trim($("#jsonUrl").val()));
                });
            }
        }();
    }]);
    app.controller('HelpController', function() {});
    app.config(['$routeProvider', '$locationProvider',
        function($routeProvider, $locationProvider) {
            $routeProvider.when('/console', {
                templateUrl : 'partials/console.html',
                controller : 'ConsoleController'
            });
            $routeProvider.when('/help', {
                templateUrl : 'partials/help.html',
                controller  : 'HelpController'
            });
            $routeProvider.otherwise({
                redirectTo : '/console'
            });
            $locationProvider.html5Mode(true).hashPrefix('!');
        }
    ]);
})();