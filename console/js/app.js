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
        this.verbMap = {
            GET : "info",
            PUT : "warning",
            POST : "success",
            DELETE : "danger"
        }

        //TEMP LOADER -- TAKE THIS OUT
        var tempJsonUrl = $location.absUrl();
        $("#jsonUrl").val(tempJsonUrl.substr(0, tempJsonUrl.lastIndexOf('/console')) + '/assets/des.json');
        //END TEMP LOADER

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
            that.apiDef = theDef;
            $("#method_list").html("");
            $("#method_pulldown").html("");
            angular.forEach(theDef.resources, function(rValue, rKey) {
                angular.forEach(rValue.methods, function(mValue, mKey) {
                    var methodVerb = angular.uppercase(mValue.verb);
                    var methodName = mValue.displayName;
                    var methodDescription = mValue.description;
                    var dataName = rKey+'||'+mKey;
                    var dataString = 'data-resourceIndex="'+dataName+'"';
                    var tooltipString = 'data-toggle="tooltip" data-placement="auto" title="'+methodDescription.replace(/<[^>]+>/gm, '')+'"';
                    var anchorClass = "list-group-item";
                    if (that.verbMap.hasOwnProperty(methodVerb)) anchorClass += " list-group-item-"+that.verbMap[methodVerb];
                    $("#method_list").append('<a class="'+anchorClass+'" href="#" '+dataString+' '+tooltipString+'><span class="label label-default">'+methodVerb+'</span>'+methodName+'</a>');
                    $("#method_pulldown").append('<option '+dataString+' value="'+dataName+'">'+methodVerb+' '+methodName+'</option>');
                });
            });
            //initialize links and options
            $('[data-toggle="tooltip"]').tooltip();
            $("#method_list a").unbind("click").click(function(event) {
                $("html, body").animate({scrollTop: 0}, "slow");
                that.showMethod($(this).attr('data-resourceIndex'));
                return false;
            });
            $("#method_pulldown").unbind("change").change(function(event) {
                that.showMethod($(this).val());
            });
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
        this.showMethod = function(resourceId) {
            var resourceKeys = resourceId.split("||");
            var theResource = that.apiDef.resources[resourceKeys[0]];
            var theMethod = theResource.methods[resourceKeys[1]];
            console.log(theMethod);
            var methodMap = {
                verb : angular.uppercase(theMethod.verb),
                name : theMethod.displayName,
                description : theMethod.description,
                path : theMethod.path,
                base : theMethod.baseUrl
            }
            var popUrl = function() {
                $("#request_method").text(methodMap.verb).removeClass("info warning success danger");
                if (that.verbMap.hasOwnProperty(methodMap.verb)) $("#request_method").addClass(that.verbMap[methodMap.verb]);
                $("#request_url").val(methodMap.path);
            }();
            var popInfo = function() {
                $("#request_information_tab").html("");
                angular.forEach(["name", "description", "base", "path"], function(theName, theIndex) {
                    $("#request_information_tab").append('<dt>'+theName+'</dt><dd>'+methodMap[theName]+'</dd>');
                });
            }();
        }
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