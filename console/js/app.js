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
        $("#jsonUrl").val(tempJsonUrl.substr(0, tempJsonUrl.lastIndexOf('/console')) + '/assets/des.json');

        this.loadDef = function(defUrl) {
            $http.get(defUrl)
                .success(function(data, status, headers, config) {
                    $location.search('api', config.url);
                    that.showDef(data);
                })
                .error(function(data, status, headers, config) {
                    that.grabDef();
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
            angular.forEach(theDef.resources, function(rValue, rKey) {
                angular.forEach(rValue.methods, function(mValue, mKey) {
                    var methodVerb = angular.uppercase(mValue.verb);
                    var methodName = mValue.displayName;
                    var methodDescription = mValue.description;
                    var dataName = rKey+'||'+mKey;
                    var dataString = 'data-resourceIndex="'+dataName+'"';
                    var tooltipString = 'data-toggle="tooltip" data-placement="auto" title="'+methodDescription.replace(/<[^>]+>/gm, '')+'"';
                    var anchorClass = "list-group-item";
                    if (methodMap.hasOwnProperty(methodVerb)) anchorClass += " list-group-item-"+methodMap[methodVerb];
                    $("#method_list").append('<a class="'+anchorClass+'" href="#" '+dataString+' '+tooltipString+'><span class="label label-default">'+methodVerb+'</span>'+methodName+'</a>');
                    $("#method_pulldown").append('<option '+dataString+' value="'+dataName+'">'+methodVerb+' '+methodName+'</option>');
                });
            });
            //initialize links and options
            $('[data-toggle="tooltip"]').tooltip();
        };
        this.grabDef = function() {
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