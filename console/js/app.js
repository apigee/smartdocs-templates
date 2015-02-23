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
            $("#submit_request").unbind("click").click(function(event) {
                that.sendRequest();
                return false;
            });
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
            if (typeof model !== "undefined") {
                that.loadDef(model);
            } else {
                var jsonUrl = ($location.search().hasOwnProperty('api')) ? $location.search().api : false;
                if (jsonUrl) {
                    that.loadDef(jsonUrl);
                } else {
                    $("#notificationModal").modal('show').find("button.js-loadDef").click(function(event) {
                        that.loadDef($.trim($("#jsonUrl").val()));
                    });
                }
            }
        }();
        this.showMethod = function(resourceId) {
            var resourceKeys = resourceId.split("||");
            var theResource = that.apiDef.resources[resourceKeys[0]];
            var theMethod = theResource.methods[resourceKeys[1]];
            $("#request_payload, #response_payload").html("");
            var methodMap = {
                verb : angular.uppercase(theMethod.verb),
                name : theMethod.displayName,
                description : theMethod.description,
                path : theMethod.path,
                base : theMethod.baseUrl,
                parameters : {}
            }
            var getParams = function() {
                if (theMethod.hasOwnProperty("authSchemes") && (theMethod.authSchemes !== null)) {
                    angular.forEach(theMethod.authSchemes, function(theScheme, theKey) {
                        if (angular.uppercase(theScheme) === "BASICAUTH") {
                            methodMap.parameters.authentication = {
                                login : {
                                    name : "login",
                                    dataType : "string"
                                },
                                password : {
                                    name : "password",
                                    dataType : "password"
                                }
                            }
                        }
                    });
                }
                angular.forEach([theResource, theMethod], function(theObj, theKey) {
                    if (theObj.hasOwnProperty("parameters") && (theObj.parameters !== null)) {
                        angular.forEach(theObj.parameters, function(pValue, pKey) {
                            if (pValue.hasOwnProperty("type") && pValue.hasOwnProperty("name")) {
                                var cleanType = angular.lowercase(pValue.type);
                                if (!methodMap.parameters.hasOwnProperty(cleanType)) methodMap.parameters[cleanType] = {};
                                methodMap.parameters[cleanType][pValue.name] = pValue;
                            }
                        });
                    }
                    if (theObj.hasOwnProperty("body") && (theObj.body !== null)) {
                        if (theObj.body.hasOwnProperty("parameters") && (theObj.body.parameters !== null) && (theObj.body.parameters.length > 0)) {
                            if (!methodMap.parameters.hasOwnProperty("body")) methodMap.parameters.body = {};
                            angular.forEach(theObj.body.parameters, function(pValue, pKey) {
                                if (pValue.hasOwnProperty("name")) methodMap.parameters.body[pValue.name] = pValue;
                            });
                        }
                    }
                });
            }();
            var popUrl = function() {
                $("#request_method").text(methodMap.verb).removeClass("info warning success danger");
                if (that.verbMap.hasOwnProperty(methodMap.verb)) $("#request_method").addClass(that.verbMap[methodMap.verb]);
                $("#request_url").val(methodMap.path).attr({"data-path":methodMap.path,"data-base":methodMap.base});
            }();
            var popInfo = function() {
                $("#request_information_tab").html("");
                angular.forEach(["base", "name", "description"], function(theName, theIndex) {
                    $("#request_information_tab").append('<dt>'+theName+'</dt><dd>'+methodMap[theName]+'</dd>');
                });
            }();
            var popParams = function() {
                $("#request_form").html("");
                var paramOrder = ["authentication", "template", "query", "header", "body"];
                angular.forEach(methodMap.parameters, function(paramVal, paramKey) {
                    if ($.inArray(paramKey, paramOrder) === -1) paramOrder.push(paramKey);
                });
                angular.forEach(paramOrder, function(paramType, typeIndex) {
                    if (methodMap.parameters.hasOwnProperty(paramType)) {
                        var thisSet = wrapWithTag(paramType, "legend");
                        var setFields = [];
                        angular.forEach(methodMap.parameters[paramType], function(paramValue, paramKey) {
                            var inputId = "request_"+paramType+"_"+paramKey;
                            var thisInput = wrapWithTag(paramKey, "label", {"for":inputId});
                            var inputExtras = {
                                name : paramKey,
                                id : inputId,
                                class : "form-control",
                                type : "text"
                            };
                            if (paramValue.hasOwnProperty("dataType") && (paramValue.dataType !== null)) {
                                if (paramValue.dataType === "password") inputExtras.type = "password";
                            }
                            if (paramValue.hasOwnProperty("defaultValue") && ((paramValue.defaultValue !== null) && (paramValue.defaultValue.length > 0))) inputExtras.placeholder = inputExtras.value = paramValue.defaultValue;
                            if (paramValue.hasOwnProperty("required") && paramValue.required === true) inputExtras.required = true;
                            thisInput += wrapWithTag("", "input", inputExtras);
                            if (paramValue.hasOwnProperty("description") && ((paramValue.description !== null) && (paramValue.description.length > 0))) thisInput += wrapWithTag(paramValue.description, "p", {"class":"help-block"});
                            setFields.push(wrapWithTag(thisInput, "div", {"class":"form-group"}));
                        });
                        thisSet += setFields.join("");
                        $("#request_form").append(wrapWithTag(thisSet, "fieldset", {"data-paramtype":paramType}));
                    }
                });
            }();
        }
        this.sendRequest = function() {
            var requestInfo = {
                settings : {
                    type : $("#request_method").text(),
                    contentType : "text/plain"
                }
            };

            //check for auth
            if ($('#request_form fieldset[data-paramtype="authentication"] input').length > 0) {
                if (!requestInfo.settings.hasOwnProperty("headers")) requestInfo.settings.headers = {};
                requestInfo.settings.headers.Authorization = "Basic "+generateAuth($("#request_authentication_login").val(), $("#request_authentication_password").val());
            }

            //build the template and query params
            requestInfo.url = $("#request_url").attr("data-base");
            var tempPath = $("#request_url").attr("data-path");
            $('#request_form fieldset[data-paramtype="template"] input').each(function() {
                tempPath = tempPath.split("{"+$(this).attr("name")+"}").join($(this).val());
            });
            requestInfo.url += tempPath;
            var queryParams = {};
            $('#request_form fieldset[data-paramtype="query"] input').each(function() {
                queryParams[$(this).attr("name")] = $(this).val();
            });
            requestInfo.url = urlEngine.setParams(queryParams, requestInfo.url);

            //build the header params
            $('#request_form fieldset[data-paramtype="header"] input').each(function() {
                if (!requestInfo.settings.hasOwnProperty("headers")) requestInfo.settings.headers = {};
                requestInfo.settings.headers[$(this).attr("name")] = $(this).val();
            });

            //build the body params
            var requestData = {};
            var doRequestData = false;
            $('#request_form fieldset[data-paramtype="body"] input').each(function() {
                requestData[$(this).attr("name")] = $(this).val();
                doRequestData = true;
            });
            if (doRequestData) requestInfo.data = JSON.stringify(requestData);

            var requestString = JSON.stringify(requestInfo);
            $("#request_payload").html(cleanJson(JSON.stringify(requestInfo)));

            requestInfo.settings.processData = false;
            requestInfo.settings["success"] = function(data, textStatus, jqXHR) {
                $("#response_payload").html(cleanJson(JSON.stringify(data)));
            };
            requestInfo.settings["error"] = function(jqXHR, textStatus, errorThrown) {
                $("#response_payload").html(cleanJson(JSON.stringify(jqXHR.responseJSON)));
            }

            $("#response_tab_trigger").click();
            apiEngine.doCall(requestInfo);
        };
    }]);
    app.controller('HelpController', function() {});
})();