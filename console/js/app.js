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
        this.loadDefinition = function(defintionUrl) {
            $http.get(defintionUrl)
                .success(function(data, status, headers, config) {
                    that.showDefinition(data);
                })
                .error(function(data, status, headers, config) {
                    that.grabDefinition();
                })
        };
        this.showDefinition = function(theDefinition) {
            console.log(theDefinition);
            that.apiDefinition = theDefinition;
            $("#method_list").html("");
            $("#method_pulldown").html("");
            var methodMap = {
                GET : "info",
                PUT : "warning",
                POST : "success",
                DELETE : "danger"
            }
            angular.forEach(theDefinition.paths, function(pathValue, pathKey) {
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
        };
        this.grabDefinition = function() {
            var swaggerUrl = ($location.search().hasOwnProperty('api')) ? $location.search().api : false;
            if (swaggerUrl) {
                that.loadDefinition(swaggerUrl);
            } else {
                $("#notificationModal").modal('show').find("button.js-loadDefinition").click(function(event) {
                    that.loadDefinition($.trim($("#swaggerUrl").val()));
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