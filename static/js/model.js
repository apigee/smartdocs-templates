/* model.js
 * Copyright (c) 2013, Apigee Corporation. All rights reserved.
 * Apigee(TM) and the Apigee logo are trademarks or
 * registered trademarks of Apigee Corp. or its subsidiaries. All other
 * trademarks are the property of their respective owners.
 */
// This file contains API Modeling docs related class defitions.
// This file is depends on jQuery, base64 jQuery plugin.
// This file also use bootstrap editor, Codemirror's XML and JSON editor plugin and Prism editor plugin.

/**
 * This class handles all commonly used functions in APIM docs such as:
 * - make an AJAX call.
 * - Opens authentication modal.
 * - Closes authentication modal.
 * - Validates authentication fields.
 * - Parse and returns JSON.
 * - Get query parameters from a URL.
 * - Escapes special charecters from a string.
 * - Shows error message to user.
 */
Apigee.APIModel.Common = function() {
    // Private properties.
    var self = this; // Keep a reference of the current class when the context of 'this' is changing.
    var authModalPosition; // To hold Authentican modal's postion.

    var MODAL_TOP_CLOSE_BUTTON = '<button aria-hidden="true" data-dismiss="modal" class="close button_close_modal" type="button">x</button>';
    var MODAL_BASIC_AUTH_HEADING = '<h3>Set Authentication</h3>';
    var MODAL_EDIT_ADMIN_AUTH_HEADING = '<h3>Set Organization Admin Credentials</h3>';
    var MODAL_INLINE_EDIT_CONFIRM_HEADING = '<h3>Warning</h3>';
    var MODAL_CUSTOM_TOKEN_HEADING = '<h3>Custom Token</h3>';
    if (typeof apiName != "undefined") {
        var MODAL_OAUTH2_HEADING = '<h3>Request '+ apiName+' permissions</h3>';
    }
    var MODAL_SESSION_WARNING = '<p>Your credentials are saved for the session only.</p>';

    var MODAL_BUTTONS = '<a class="btn btn-primary button_save_modal" href="javascript:void(0)">Save</a><a class="button_close_modal" href="javascript:void(0)">Cancel</a><a class="button_token_request_modal" href="javascript:void(0)">Send Token Request</a>'
    var MODAL_BUTTONS_EDIT = MODAL_BUTTONS.replace("Cancel","Discard");
    // Private methods
    /**
     * This method validates if an email address is valid or not.
     * @param {String} elementValue An email ID value.
     * @return {Boolean} true if it is a valid email address, otherwise returns false.
     */
    this.validateEmail = function(elementValue) {
        var flag = false;
        if ($.trim(elementValue).length > 1) { // Chceck if it is empty.
            var regEx = RegExp(/^[a-zA-Z0-9_]{0,1}([a-zA-Z0-9_\.\-\+\&\/\$\!\#\%\'\*\=\?\^\`\{\|\}\~])+([a-zA-Z0-9_\-\+\&\/\$\!\#\%\'\*\=\?\^\`\{\|\}\~]{0,1})+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/);
            if (regEx.test(elementValue)) {
                if(elementValue.indexOf("..")==-1) flag = true;
            }
        }
        return flag;
    };

    navigator.sayswho = (function() {
        var N= navigator.appName, ua= navigator.userAgent, tem;
        var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
        M= M? [M[1], M[2]]: [N, navigator.appVersion, '-?'];
        return M;
    })();

    showMessage = function(msg) {
        theParent = document.getElementsByTagName("body")[0]
        theKid = document.createElement("div");
        theKid.setAttribute("style","height:20px;width:100%;background-color:#F9F6C5;text-align:center;position:fixed;z-index:999;");
        theKid.innerHTML = msg;
        theParent.appendChild(theKid);
        theParent.insertBefore(theKid, theParent.firstChild);
    };

    // Public methods.
    /**
     * This method makes an AJAX call and handles the success/failure callback.
     * @param {Object} request A request which contains all necessary information to make an AJAX like, method type, URL and so on..,
     * @return {Void} make an AJAX call and handles succces and failure callback.
     */
    this.makeAJAXCall = function(request) {
        var requestUrl = request.url.toString();
        var currentHost = document.location.host.toString();
        if (requestUrl.indexOf("targeturl=") != -1) {
            requestUrl = requestUrl.split("targeturl=")[0].toString();
        }    
        if ($.browser.msie && window.XDomainRequest && parseInt($.browser.version) <= 9 && requestUrl.indexOf(currentHost) == -1) {
            var requestURL = request.url;
            var defaultMethodType = (request.type) ? request.type : "get";
            if (requestURL.indexOf("targeturl") != -1) {
                var requestVerb = (request.type) ? request.type : "get";
                requestURL += "&method="+requestVerb;
                defaultMethodType = "POST";
            }
            if (request.headers) {
                var headersList = request.headers;
                var headersString = "{";
                for (var i=0,l=headersList.length; i<l; i++) {
                    headersString += '"' + headersList[i].name + '" : "' + headersList[i].value +'"';
                    if (l != 1 && i != (l-1)) {
                        headersString += ',';
                    }
                }
                headersString += "}";
                headersString = encodeURIComponent(headersString);
                requestURL += "&headers="+headersString;
            }
            var methodData = (request.data) ? request.data : null;
            xdr = new XDomainRequest();
            xdr.onload = function() {
                var data;
                var forJSON = true;
                try {
                    data = $.parseJSON(xdr.responseText);
                }
                catch (e) {
                    forJSON = false;
                }
                if (!forJSON) {
                    request.callback(xdr.responseText);
                } else {
                    if (data) {
                        var responseStatusCode = data.responseStatusCode
                        if (responseStatusCode) {
                            if (parseInt(responseStatusCode) >= 400) {
                                if (request.errorCallback) {
                                    request.errorCallback(responseStatusCode);
                                    $("#working_alert").fadeOut(); // Hide working alert message.
                                    return;
                                } else {
                                    request.callback(data);
                                    $("#working_alert").fadeOut(); // Hide working alert message.
                                    return;
                                }
                            }
                        }
                        request.callback(data);
                    } else {
                        request.callback(xdr.responseText);
                    }
                }
                $("#working_alert").fadeOut(); // Hide working alert message.
            }
            xdr.onerror = function() {
                if (request.errorCallback) {
                    request.errorCallback(xdr.responseText);
                } else {
                    request.callback(xdr.responseText);
                }
                $("#working_alert").fadeOut(); // Hide working alert message.
            }
            xdr.open(defaultMethodType, requestURL);
            xdr.send(methodData);
        } else {
            $.ajax({
                url:request.url,
                cache: false,
                type:(request.hasOwnProperty("type")) ? request.type : "get", // Type of a method, "get" by default.
                data:(request.hasOwnProperty("data")) ? request.data : null, // Request payload of a method, "null" by default.
                contentType: (request.hasOwnProperty("contentType")) ? request.contentType : "application/x-www-form-urlencoded;charset=utf-8",
                processData: (request.hasOwnProperty("processData")) ? request.processData : true,
                // Set custom headers, if any.
                beforeSend : function(req) {
                    if (request.headers) {
                        for (var i=0,l=request.headers.length; i<l; i++) {
                            var header = request.headers[i];
                            req.setRequestHeader(header.name, header.value);
                        }
                    }
                },
                // Success callback handler of an AJAX call.
                // Invoke the the request's callback method with the response content.
                success:function(data, textStatus, jqXHR) {
                    if (typeof data != "object") {
                        request.callback(jqXHR.responseText);
                    } else {
                        if (data) {
                            var responseStatusCode = data.responseStatusCode
                            if (responseStatusCode) {
                                if (parseInt(responseStatusCode) >= 400) {
                                    if (request.errorCallback) {
                                        request.errorCallback(responseStatusCode);
                                        return;
                                    } else {
                                        request.callback(data);
                                        return;
                                    }
                                }
                            }
                            request.callback(data);
                        }
                    }
                },
                // Error callback handler of an AJAX call.
                // Invoke the request's error callback method, if any. Otherwise call the general callback method.
                error: function(xhr, status, error) {
                    if (request.errorCallback) {
                        request.errorCallback(xhr.status);
                    } else {
                        request.callback(xhr.responseText);
                    }
                },
                // Gets called once an AJAX completes.
                complete: function() {
                    $("#working_alert").fadeOut(); // Hide working alert message.
                }
            });
        }
    };

    /**
     * This method closes the authentication modal dialog.
     */
    this.closeAuthModal = function() {
        $('[role="dialog"].modal').modal('hide')
        $('[role="dialog"].modal input').removeClass('error'); // Remove error class from the input boxes.
        $('[role="dialog"].modal .error_container').hide().html(''); // Empty the error container and hide it.
        //return false;
    };

    /**
     * This method validates the authentication fileds like email and password.
     * @return {String} empty string if there are no validation errors, otherwise returns the error message which needs to be displayed.
     */
    this.validateBasicAuthFields = function(modalName) {
        var errMessage = "";
        userEmail = $.trim($("[data-role='"+modalName+"']").find("#inputEmail").val());
        if (!userEmail.length) { // Check if it is empty.
            $("#inputEmail").addClass("error");
            errMessage += "<span>Email/Username required.</span><br/>";
        }
        var userPasswordElement = $("[data-role='"+modalName+"']").find("#inputPassword");
        if (!$.trim(userPasswordElement.val()).length) { // Check if it is empty.
            userPasswordElement.addClass("error");
            errMessage += "<span>Password required.</span><br/>"
        }
        return(errMessage);
    };

    this.shortenText = function(element,len) {
        var elementVal = element.text();
        if (elementVal.length > len) {
            elementVal = elementVal.substring(0,len-3) + "...";
            element.text(elementVal);
        }
    };

    /**
     * This method parses the given JSON from a string.
     * @param {String} theText A string which needs to convert as JSON,
     * @return {Object} JSON object if the given text is a proper JSON.
     */
    this.parseAndReturn = function(theText) {
        var theJson = '';
        try {
          theJson = $.parseJSON(theText);
        } catch (e) {
          theJson = theText;
        }
        return theJson;
    };

    /**
     * This method fetches query parameter from the given URL.
     * @param {String} queryURL An URL.
     * @param {String} paramName A query parameter name.
     * @return {String} param value if the param name available in the URL, otherwise returns an empty string.
     */
    this.getQueryParam = function(queryURL , paramName) {
        var QueryString = queryURL.split("?") // Get the QueryString from the URL.
        if (QueryString.length > 2 ) {
            QueryString = queryURL.split(/\?(.*)/);
        }
        if ( QueryString.length > 1 ) {
            QueryString = QueryString[1];
            QueryString = QueryString.split( "&" );
            for( var i = 0; i < QueryString.length; i++ ) {
                var queryParam =  QueryString[i].split( "=" ); // Creates a name and value element for each parameter in the QueryString.
                if( queryParam[0] == paramName ) {
                    return queryParam[1]; // Return query param value if query param name match with the given name.
                }
            }
            return ""; // Return empty string, if param name does not match with the the URL.
        }
        return ""; // // Return empty string, if there are no query params in the URL.
    };

    /**
     * This method escapes the special charecters like new line charecter, quotes and .., from a string.
     * @param {String} str A String,
     * @return {String} escaped charecters string.
     */
    this.escapeSpecialChars = function(str) {
        return str.replace(/\\n/g, "\\n")
            .replace(/'/g, "\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, "\\&")
            .replace(/\\r/g, "\\r")
            .replace(/\\t/g, "\\t")
            .replace(/\\b/g, "\\b")
            .replace(/\\f/g, "\\f");
    };

    /**
     * This method shows error message to the user.
     * @param {String} errorMessage A error message string.
     * @return {Void} displays error message.
     */
    this.showError = function(errorMessage) {
        $("[data-role='error_container']").html(errorMessage).show();
        $("body").scrollTop(0); // Scroll to page's top position.
    };

    this.showUnsupportedBrowserAlertMessage = function() {
        var browserNameAndVersion= navigator.sayswho.toString();
        var browserName = browserNameAndVersion.split("\,")[0].toLowerCase();
        var version = parseInt(browserNameAndVersion.split("\,")[1]);
        var msg = "<p>You are using an unsupported browser. Please switch to Chrome, Firefox >= 10, Safari >= 6 or Internet Explorer >= 9. [ <a href='javascript:void(0)' onclick='apiModelCommon.hideUnsupportedBrowserMessage()'> Close</a> ]</p>";
        if ( browserName != "chrome") {
          if (browserName == "firefox") {
            if (version < 10) {
              showMessage(msg);
            }
          }
          if (browserName == "safari") {
            if (version < 6 ) {
              showMessage(msg);
            }
          }
          if (browserName == "msie") {
            if (version < 9 ) {
              showMessage(msg);
            }
          }
        }
  };
  this.hideUnsupportedBrowserMessage = function() {
        document.getElementsByTagName("body")[0].getElementsByTagName("div")[0].style.display = "none";
        localStorage.setItem("unsupportedBrowserFlag","true");
  };
  this.showUnsupportedAttachementAlertMessage = function() {
        showMessage("<p>Attachement is not supported in IE9. Please switch to Chrome, Firefox >= 10, Safari >= 6 or Internet Explorer >= 10. [ <a href='javascript:void(0)' onclick='apiModelCommon.hideUnsupportedAttachementMessage()'> Close</a> ]</p>");
  };
  this.hideUnsupportedAttachementMessage = function() {
      document.getElementsByTagName("body")[0].getElementsByTagName("div")[0].style.display = "none";
      localStorage.setItem("unsupportedAttachmentFlag","true");
  };
  this.dateDiff = function (date1, date2) {
      var datediff = date1.getTime() - date2.getTime(); //store the getTime diff - or +
      return (datediff / (24*60*60*1000)); //Convert values to -/+ days and return value
  };
};

Apigee.APIModel.Editor = function() {
    var editor; // A Code mirror editor for the request payload.
    /**
     * This method initializes the request payload sample code mirror editor.
     */
    this.initRequestPayloadEditor = function() {
        if ($('[data-role="request-payload-example"]').length) { // Check if request payload example element is available.
            $('[data-role="request-payload-example"]').children("textarea").show();
            bodyPayloadElementValue = $.trim($('[data-role="request-payload-example"]').find("textarea").val());
            $('.request_payload textarea').val(bodyPayloadElementValue);
            bodyPayloadElement = $('.request_payload textarea');
            if (bodyPayloadElement) { // Set xml/json mode based on the request payload value.
                var modeName = (bodyPayloadElement.data("format") == "application/xml") ? "xml" : "javascript";
                editor = CodeMirror.fromTextArea( $('.request_payload textarea').get(0), {
                    mode: modeName,
                    lineNumbers: true
                });
                if (editor.lineCount() <= 2) {
                    editor.setSize('100%',editor.lineCount()*18);
                } else {
                    editor.setSize('100%',editor.lineCount()*15);
                }

            }
        }
    };
    /*
     * Get the request payload sample editor value.
     * @return {String} Value of a request payload editor.
     */
    this.getRequestPayLoad = function() {
        return editor.getValue();
    };
    /*
     * Set request payload sample editor value.
     * @param {String} payload A request payload value.
     */
    this.setRequestPayLoad = function(payload) {
        editor.setValue(payload);
    };
};
/**
 * This class handles operation page related functions.
 */
Apigee.APIModel.Methods = function() {
    // Private properties
    var self = this; // Keep a reference of the current class when the context of 'this' is changing.
    // Check if it needed here, bacase it is not used anywhere other then init
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"]; // Stores all the month's display name.
    var lastModifiedDate;               // Last modified date in readable form.
    var methodURLElement;               // Holds the resource URL element.
    var basicAuth = "";                 // Holds basic auth value.
    var passwordGrantCredentials = "";  // Holds password grant credentials.
    var passwordGrantToken = "";        // Holds password grant token.
    var oauth2Credentials = {};         // Holds OAuth 2 credential details.
    var userEmail = "";                 // Holds user email.
    var authType;                       // Holds auth type details.
    var rawCode = "";                   // Stores response content of the testApi call.
    var bodyContent;                    // Stores request content of the testApi call.
    var isTemplateParamMissing = false; // To check if template param is missing.
    var templateParamMissing = [];      // Stores missing template params.
    var isHeaderParamMissing = false;   // To check if header param is missing.
    var headerParamMissing = [];        // Stores missing header params.
    var isQueryParamMissing = false;    // To check if query param is missing.
    var queryParamMissing = [];         // Stores missing query params.
    var requestEditor;                  // A Prism editor for method's request.
    var responseEditor;                 // A Prism editor for method's response.
    var customTokenObject = {};
    var isCutomTokenShown = false;
    var custemTokenCredentials = "";
    var selectedAuthScheme = "";        // Holds selected auth scheme name.
    var windowLocation = window.location.href; // Current window URL.
    var apiName = Apigee.APIModel.apiName; // Stores the apiName rendered from template.
    var revisionNumber = Apigee.APIModel.revisionNumber; // Stores the revision number rendered from template.
    var targetUrl = "";
    var DEFAULT_OPTIONAL_PARAM_OPTION = "-None-"

    // Public methods.
    /**
     * This method invokes the necessary details for the operation page.
     */
    this.init = function() {
        // Convert the auth type value as user friendly text.
        var authTypeElement = $("[data-role='auth-type']");
        authType = $.trim(authTypeElement.text());
        if (authType.split(",").length > 1) {
            authType = authType.substr(0,authType.length-1); // Remove the last extra comma symbol.
        }
        authType = authType.replace("BASICAUTH","Basic Auth").replace("CUSTOM","Custom Token").replace("OAUTH1WEBSERVER", "OAuth 1").replace("OAUTH1CLIENTCREDENTIALS", "OAuth 1 Client Credentials").replace("OAUTH2WEBSERVER","OAuth 2").replace("OAUTH2CLIENTCREDENTIALS","OAuth 2 Client Credentials").replace("OAUTH2IMPLICITGRANT","OAuth 2 Implicit Grant Flow").replace("OAUTH2PASSWORDGRANT","Password Grant").replace("PASSWORDGRANT", "Password Grant").replace("NOAUTH","No auth");

        authTypeElement.html(authType); // Update the auth type HTML element.

        self.updateAuthContainer();
        //Fix for extraneous space in the resource URL.
        var resourceURLString = "";
        $("[data-role='method_url_container'] span").each(function() {
            resourceURLString += '<span data-role="'+ $(this).attr('data-role') + '">' +$(this).html() + '</span>';
        });

        $("[data-role='method_url_container']").html(resourceURLString);
        // Template parameter releated changes.
        methodURLElement = $("[data-role='method_url_container']");
        // Add tooltip to template params.

        methodURLElement.html(methodURLElement.html().replace(/\{/g,"<span data-toggle='tooltip' data-original-title=''><span class='template_param' contenteditable='true'>{").replace(/\}/g,"}</span><span></span></span>"));

        methodURLElement.find("span.template_param").each(function() {
            $(this).siblings("span").attr("data-role",$(this).text());
        });

        // Create a sibling node to each template param and add original value to the siblings.
        // Original value will be used while validating template params.
        $("[data-role='template-params']").find("p").each(function() {
            var templateParamName = $(this).find("[data-role='name']").html();
            var templateParamDescription = $(this).find("[data-role='description']").html();
            $("[data-toggle='tooltip']").each(function() {
                var curElement = $(this).find("span:eq(1)").data("role");
                if (curElement) {
                    curElement = curElement.substring(1,curElement.length-1);
                    if (curElement == templateParamName) {
                        templateParamDescription = $.trim(templateParamDescription);
                        if (templateParamDescription.charAt(templateParamDescription.length-1) != ".") {
                            templateParamDescription += ".";
                        }
                        $(this).attr('data-original-title',templateParamDescription+" Click to edit the value.");
                    }
                }
            });
        });

        // Replace template param values with the values stored in local storage.
        if (localStorage.hasOwnProperty('templateParams')) {
            var templateParams = JSON.parse(localStorage.getItem('templateParams'));
            for (var i=0; i<templateParams.length; i++) {
                var paramName = templateParams[i].name;
                var paramValue = templateParams[i].value;
                $("[data-role='method_url_container'] span.template_param").each(function() {
                    var spanElement = $(this).siblings("span");
                    var inputElement = $(this);
                    if(spanElement.attr('data-role') == paramName) {
                        inputElement.text($.trim(paramValue));
                    }
                });
            }
        }
        // Create a new custom property called 'data-original-value' in query params and header params value field.
        // Assign the default value to the custom property 'data-original-value'. This value will be used in clicking 'reset' link.
        $("[data-role='query-param-list'],[data-role='header-param-list'], [data-role='body-param-list'], [data-role='attachments-list']").each(function(i, obj) {
            if (!$(this).find("span.required").length && $(this).find(".value select").length) {
                $(this).find(".value select").prepend("<option value='"+DEFAULT_OPTIONAL_PARAM_OPTION+"' selected>"+DEFAULT_OPTIONAL_PARAM_OPTION+"</option>");
            }
            var valueElement = $(this).find("[data-role='value']");
            valueElement.attr('data-original-value',$.trim(valueElement.val()));
        });
        // Remove the last extra comma symbol from category field.
        var categoryElement = $("[data-role='category']");
        var categoryElementValue = $.trim(categoryElement.text());
        if (categoryElementValue.split(",").length > 1) {
            categoryElementValue = categoryElementValue.substr(0,categoryElementValue.length-1); // Remove the last extra comma symbol.
        }
        categoryElement.html(categoryElementValue); // Update the auth type HTML element.
        // Show the request payload docs by default if request payload sample is not available.
        if ($("[data-role='request-payload-docs']").length && !$("[data-role='request-payload-example']").length) {
            $("[data-role='request-payload-docs']").show();
        }
        $("#working_alert").css('left',($(window).width()/2)- 56); // Set working alert container left position to show in window's center position.
        $("#method_content").show();
        window.apiModelEditor.initRequestPayloadEditor(); // Initialize the request payload sample editor.
        var proxyURLLocation = windowLocation.split("/apimodels/")[0];
        if (typeof Drupal != "undefined" && typeof Drupal.settings != "undefined") {
            proxyURLLocation = Drupal.settings.devconnect_docgen.apiModelBaseUrl +"/v1/o/" + Apigee.APIModel.organizationName;
        }
        if (Apigee.APIModel.apiModelBaseUrl) {
            proxyURLLocation = Apigee.APIModel.apiModelBaseUrl +"/v1/o/" + Apigee.APIModel.organizationName;
        }

        // TODO: rewrite this i think..
        proxyURLLocation = proxyURLLocation + "/apimodels/proxyUrl"; // Proxy URL location format: https://<domain name>/<alpha/beta/v1>/o/apihub/apimodels/proxyUrl
        self.makeAJAXCall({"url":proxyURLLocation, "callback":self.storeProxyURL}); // Make an AJAX call to retrieve proxy URL to make send request call.
        Apigee.APIModel.initMethodsPageEvents();
        Apigee.APIModel.initMethodsAuthDialogsEvents();
    };

    /**
     * Success callback method of a proxy URL AJAX call.
     * @param {Object} data - response content of a proxy URL AJAX call.
     * @return {Void} sets proxy URL value to local variable 'proxyURL'.
     */
    this.storeProxyURL = function(data) {
        Apigee.APIModel.proxyURL = data.proxyUrl;
        Apigee.APIModel.authUrl = data.authUrl;
        Apigee.APIModel.proxyURL = Apigee.APIModel.proxyURL + "/sendrequest";
    }

    /**
     * Success callback method of a OAuth2 web serser auth URL AJAX call.
     * @param {Object} data - response content of OAuth2 web serser auth URL AJAX call.
     * @return {Void} opens a new window to make OAuth dance.
     */
    this.renderCallbackURL = function(data) {
        if (typeof Drupal != "undefined" && typeof Drupal.settings != "undefined") {
            var oauth2AuthUrlPart1 = data.authUrl.split("redirect_uri=")[0];
            var oauth2AuthUrlPart2 = data.authUrl.split("redirect_uri=")[1];
            oauth2AuthUrlPart2 = oauth2AuthUrlPart1+"redirect_uri="+encodeURIComponent(Drupal.settings.devconnect_docgen.oauth2AuthUrl+"?org="+Apigee.APIModel.organizationName+"&api="+Apigee.APIModel.apiName+"&revision="+Apigee.APIModel.revisionNumber) + "&client_id=" + oauth2AuthUrlPart2.split("client_id=")[1];
            window.open(oauth2AuthUrlPart2, "oauth2Window", "resizable=yes,scrollbars=yes,status=1,toolbar=1,height=500,width=500");
        } else {
            window.open(data.authUrl, "oauth2Window", "resizable=yes,scrollbars=yes,status=1,toolbar=1,height=500,width=500");
        }
    };

    /**
     *  Sends request for 'access+token' to Purina, places it into a form element 'inToken' in password_grant_modal 
     *  @param  {Void}  It grabs the elements with $
     *  @return {Void}  puts token into html component in password grant modal
     */
    this.handlePWG = function() {
        // make request to purina - http://moearthnetworks-test.apigee.net/purina/oauth2/token
            // make an ajax call to get the token
        userEmail = $("#inEmail")[0].value;
        var inputData = "grant_type=password&username=" + userEmail + "&password=";
        var validEmail = false;
        var elementValue = userEmail;
        if ($.trim(elementValue).length > 1) {  // Chceck if it is empty.
            var regEx = RegExp(/^[a-zA-Z0-9_]{0,1}([a-zA-Z0-9_\.\-\+\&\/\$\!\#\%\'\*\=\?\^\`\{\|\}\~])+([a-zA-Z0-9_\-\+\&\/\$\!\#\%\'\*\=\?\^\`\{\|\}\~]{0,1})+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/);
            if (regEx.test(elementValue)) {
                if(elementValue.indexOf("..")==-1) validEmail = true;
            }
        }
        if (validEmail && $("#inPassword")[0].value != "") {
            $.ajax({
                url: encodeURI('http://moearthnetworks-test.apigee.net/purina/oauth2/token'),
                type: 'POST',
                data: inputData + $("#inPassword")[0].value,
                contentType: 'application/x-www-form-urlencoded',
                success: function (data, textStatus, jqXHR) {
                    // sessionStorage.apisPasswordGrantCredentials = apiName + "@@@" + revisionNumber + "@@@" + "Bearer "+ data.access_token;
                                        
                    // reset values
                    $("#inPassword").val("");
                    $("#inEmail").val("");

                    // hide unnecesary stuff (email, pw, send request button)
                    $("#inEmailLabel").hide();
                    $("#inEmail").hide();
                    $("#inPasswordLabel").hide();
                    $("#inPassword").hide();
                    $("#sendPWGmodal").hide();

                    // show updated token element
                    passwordGrantToken = data.access_token;
                    $("#inToken").val(self.truncateDisplay(data.access_token, 6));
                    $("#inTokenLabel").show();
                    $("#inToken").show();

                    // effect is showing save button only when token is there and cleaned up interface
                    $("savePWGmodal").show();

                },
                error: function (jqXHR, status, error) { 
                    $("[role='dialog'].modal .error_container").html(error).show();
                },
            });
        } else {
            $("[role='dialog'].modal .error_container").html("We can't seem to find your credentials!").show();   
        }
    }

    /**
     * Error callback method of a OAuth2 web serser auth URL AJAX call.
     * @return {Void} shows error message to the User.
     */
    this.handleOAuth2Failure = function() {
        self.showError("Unable to proceed because of missing OAuth configuration.");
    };

    this.renderCustomTokenCredentials = function(data) {
        var defaultCustomTokenObject = data;
        var customTokenType = defaultCustomTokenObject.tokenType;
        var tokensLength = Object.keys(defaultCustomTokenObject.tokenMap).length;
        $("[data-role='custom_token_row']" ).each(function(index) {
            if(index > 0) {
                $(this).remove();
            }
        });
        if (tokensLength >= 1) {
            for( var i=1, n= tokensLength; i<n; i++) {
                $("[data-role='custom_token_row']" ).first().clone().appendTo( "[data-role='custom_token_rows']" );
            }
        }
        var index = 1;
        for (var key in defaultCustomTokenObject.tokenMap) {
            var customTokenName = key;
            var customTokenValue = defaultCustomTokenObject.tokenMap[key];
            $("[data-role='custom_token_row']:nth-child("+index+")").find("[data-role='name']").val(customTokenName);
            $("[data-role='custom_token_row']:nth-child("+index+")").find("[data-role='value']").val(customTokenValue);
            index++;
        }
        if (customTokenType == "header") {
            $("[data-role='custom_token_modal']").find("[data-role='header']").attr('checked','checked');
        } else {
            $("[data-role='custom_token_modal']").find("[data-role='query']").attr('checked','checked');
        }
    };

    this.handleCustomTokenFailure = function() {
        self.showError("Unable to proceed because of missing Custom token configuration.");
    };

    /**
     * Update template param width based on number of charecter.
     * @param {HTML Element} element - Template parameter input element.
     * @return {Void} sets the input element's width based on number of charecters.
     */
    this.updateTemplateParamWidth= function(element, isRightArrow) {
        var value = element.text();
        var size  = value.length;
        if (size == 0) {
            size = 8.4; // average width of a char.
        } else {
            size = Math.ceil(size*8.4); // average width of a char.
        }
        if (isRightArrow) {
            element.css('width',size); // Set the width.
        } else {
            element.css('width','auto');
        }
    };

    this.updateTemplateParamText= function(element) {
        var value = element.text();
        var size  = value.length;
        if (size == 0) {
            size = 8.4; // average width of a char.
            element.html("&nbsp;")
        } else {
            size = Math.ceil(size*8.4); // average width of a char.
            if (element.html().indexOf("&nbsp;") != -1) {
                element.slice(element.html().indexOf("&nbsp;"),element.html().indexOf("&nbsp;")+1);
            }
        }
    };

    /**
     * This method updates the authentication container based on the auth type value to make Send request AJAX call.
     * @return {Void} updates the authentication container.
     */
    this.updateAuthContainer = function() {
        if (authType.indexOf("No auth") != -1) {
            $("[data-role='authentication_container']").css({'visibility':'hidden'});
            $(".icon_lock").css({'visibility':'hidden'});
        } else {
            if (authType.indexOf("Basic Auth") != -1) { // Show Basic auth info in the operation container.
                if (authType.indexOf(",") == -1) {
                    sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" + "basicauth";
                    selectedAuthScheme ="basicauth";
                }
                var basicAuthCredentials = "";
                if (localStorage.apisBasicAuthDetails) {
                    var date = new Date();
                    var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
                    var lsTimeStamp  = localStorage.apisBasicAuthDetails.split("@@@")[3];
                    var currentTimeStamp = dateString;
                    var dtDiff = currentTimeStamp-lsTimeStamp;
                    var dtDiff = parseInt(self.dateDiff(new Date(currentTimeStamp),new Date(lsTimeStamp)));
                    if (dtDiff > 30) {
                        localStorage.removeItem("apisBasicAuthDetails");
                    } else {
                        basicAuthCredentials = localStorage.apisBasicAuthDetails;
                    }
                } else if (sessionStorage.apisBasicAuthDetails) {
                    basicAuthCredentials = sessionStorage.apisBasicAuthDetails;
                }
                if (basicAuthCredentials !== "") {
                    // Format of the apisBasicAuthDetails - api name@@@basic auth details.
                    if (apiName==basicAuthCredentials.split("@@@")[0]) {
                        userEmail = basicAuthCredentials.split("@@@")[1];
                        var emailString = userEmail;
                        if (emailString.length > 12) {
                            emailString = emailString.substring(0,12) +"..."; // Trim the email string.
                        }
                            basicAuth = basicAuthCredentials.split("@@@")[2]; // Store to local variable, for further reference.
                            if (sessionStorage.selectedAuthScheme) {
                                var selected = (apiName == sessionStorage.selectedAuthScheme.split("@@@")[0] && revisionNumber == sessionStorage.selectedAuthScheme.split("@@@")[1] && sessionStorage.selectedAuthScheme.split("@@@")[2]== "basicauth") ? "selected" : "";
                            }
                        //$(".authentication").html(constructAuthenticationHTML('basicauth',selected,emailString)); // Display current user's basic auth info.
                        if (selected != "") {
                            $("[data-role='basic_auth_container']").addClass(selected);
                        }
                        $("[data-role='basic_auth_container']").find(".link_open_basicauth").html(emailString);
                        $("[data-role='basic_auth_container']").find(".icon-remove").css('display','inline-block');
                    }
                }
                $("[data-role='basic_auth_container']").show();
            }
            else if (authType.indexOf("OAuth 2") != -1) { // Show OAuth 2 info in the operation container.
                if (authType.indexOf(",") == -1) {
                    sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" +"oauth2";
                    selectedAuthScheme = "oauth2";
                }
                var authCredentials = "";
                if (localStorage.apisOAuth2CredentialsDetails) {
                    var date = new Date();
                    var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
                    var lsTimeStamp  = localStorage.apisOAuth2CredentialsDetails.split("@@@")[2];
                    var currentTimeStamp = dateString;
                    var dtDiff = currentTimeStamp-lsTimeStamp;
                    var dtDiff = parseInt(self.dateDiff(new Date(currentTimeStamp),new Date(lsTimeStamp)));
                    if (dtDiff > 30) {
                        localStorage.removeItem("apisBasicAuthDetails");
                    } else {
                        authCredentials = localStorage.apisOAuth2CredentialsDetails;
                    }
                } else if (sessionStorage.apisOAuth2CredentialsDetails) {
                    authCredentials = sessionStorage.apisOAuth2CredentialsDetails;
                }
                if (authCredentials !== "") {
                    // Format of the apisBasicAuthDetails - api name@@@revision number@@@oauth 2 details.
                    if (apiName == authCredentials.split("@@@")[0]) {
                        oauth2Credentials = $.parseJSON(authCredentials.split("@@@")[1]);
                        var selected = (apiName == authCredentials.split("@@@")[0] && sessionStorage.selectedAuthScheme.split("@@@")[1]== "oauth2") ? "selected" : "";
                        if (selected != "") {
                            $("[data-role='oauth2_container']").addClass(selected);
                        }
                        $("[data-role='oauth2_container']").find(".link_open_oauth2").html("Authenticated");
                        $("[data-role='oauth2_container']").find(".icon-remove").css('display','inline-block');
                    }
                }
                $("[data-role='oauth2_container']").show();
            }
            else if (authType.indexOf("Custom Token") != -1) { // Show Custom token info in the operation container.
                if (authType.indexOf(",") == -1) {
                    sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" +"customtoken";
                    selectedAuthScheme = "customtoken";
                }
                var custemTokenSession = sessionStorage.revisionsCustomTokenCredentialsDetails;
                if (custemTokenSession) { // Check if Custom token details stored in session storage.
                    // Format of the revisionsCustomTokenDetails - api name@@@revision number@@@oauth 2 details.
                    if (apiName==custemTokenSession.split("@@@")[0] && revisionNumber==custemTokenSession.split("@@@")[1]) { // Check if apiName and revison number matches.
                        customTokenObject = JSON.parse(custemTokenSession.split("@@@")[2])
                        //custemTokenCredentials = custemTokenSession.split("@@@")[2]+ "@@@" + custemTokenSession.split("@@@")[3]+ "@@@" + custemTokenSession.split("@@@")[4];
                        var selected = (apiName == sessionStorage.selectedAuthScheme.split("@@@")[0] && revisionNumber == sessionStorage.selectedAuthScheme.split("@@@")[1] && sessionStorage.selectedAuthScheme.split("@@@")[2]== "customtoken") ? "selected" : "";
                        if (selected != "") {
                            $("[data-role='custom_token_container']").addClass(selected);
                        }
                        $("[data-role='custom_token_container']").find(".link_open_customtoken").html("Custom Token");
                        $("[data-role='custom_token_container']").find(".icon-remove").css('display','inline-block');
                    }
                }
                $("[data-role='custom_token_container']").show();
            }
            else if (authType.indexOf("Password Grant") != -1) {  // Show password grant info
                if (authType.indexOf(",") == -1) {
                    sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" +"passwordgrant";
                    selectedAuthScheme = "passwordgrant";
                }
                // var passwordGrantCredentials = "";
                if (localStorage.apisPasswordGrantCredentials) {
                    var date = new Date();
                    var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
                    var lsTimeStamp  = localStorage.apisOAuth2CredentialsDetails.split("@@@")[2];
                    var currentTimeStamp = dateString;
                    var dtDiff = currentTimeStamp-lsTimeStamp;
                    var dtDiff = parseInt(self.dateDiff(new Date(currentTimeStamp),new Date(lsTimeStamp)));
                    if (dtDiff > 30) {
                        localStorage.removeItem("apisPasswordGrantCredentials");
                    } else {
                        passwordGrantCredentials = localStorage.apisPasswordGrantCredentials;
                    }
                } else if (sessionStorage.apisPasswordGrantCredentials) {
                    passwordGrantCredentials = sessionStorage.apisPasswordGrantCredentials;
                }
                if (passwordGrantCredentials !== "") {
                    // Format of the apisBasicAuthDetails -> api name@@@revision number@@@oauth 2 details.
                    if (apiName == passwordGrantCredentials.split("@@@")[0]) {
                        passwordGrantCredentials = $.parseJSON(passwordGrantCredentials.split("@@@")[1]);
                        var selected = (apiName == passwordGrantCredentials.split("@@@")[0] && sessionStorage.selectedAuthScheme.split("@@@")[1]== "passwordgrant") ? "selected" : "";
                        if (selected != "") {
                            $("[data-role='password_grant_container']").addClass(selected);
                        }
                        $("[data-role='password_grant_container']").find(".link_open_passwordgrant").html("Authenticated");
                        $("[data-role='password_grant_container']").find(".icon-remove").css('display','inline-block');
                    }
                }
                $("[data-role='password_grant_container']").show();


                // TODO: TEST above password grant --> make this such that it works with the remember checkbox

            }


            Apigee.APIModel.initMethodsAuthDialogsEvents();
        }
    };

    /**
     * The request/response link click event handler - Show/Hide request/response tab content, based on the link.
     * @return {Void} Show/Hide request/response tab content.
     */
    this.swapSampleRequestResponseContainer = function() {
        var $currentElement = $(this);
        if ($currentElement.attr('id') == 'link_request_tab') { // Show the request
            $("#link_response_tab").removeClass('selected');
            $("#request_response_container .response").hide();
            $("#request_response_container .request").show();
        } else {
            $("#link_request_tab").removeClass('selected');
            $("#request_response_container .request").hide();
            $("#request_response_container .response").show();
        }
        $currentElement.addClass('selected');
    };

    /**
     * The method handles saving auth details/displays error, when user clicks 'Save' button in the Basic Auth pop-up dialog.
     */
    this.saveAuthModal = function(e) {
        var parentClass = $(this).parents(".modal");
        var error = false;
        if (parentClass.attr('data-role') == 'basic_auth_modal') {
            var errMessage = self.validateBasicAuthFields('basic_auth_modal'); // Validate email and password.
            if (errMessage == "") { // If there are no errors.
                userEmail = $("#inputEmail").val();
                basicAuth = "Basic "+$.base64Encode(userEmail+':'+$("#inputPassword").val());
                var rememberCheckbox = $("[data-role='basic_auth_modal']").find("#chk_remember").is(":checked");
                if (rememberCheckbox) {
                    var date = new Date();
                    var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
                    localStorage.apisBasicAuthDetails = apiName + "@@@" + userEmail + "@@@" + basicAuth + "@@@" + dateString; // Store basic auth info in session storage.
                } else {
                    localStorage.removeItem("apisBasicAuthDetails");
                    sessionStorage.apisBasicAuthDetails = apiName + "@@@" + userEmail + "@@@" + basicAuth;  // Store basic auth info in local storage with time stamp.
                }
                self.closeAuthModal(); // Close the auth modal.
                sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" + "basicauth"; // Store seleted auth scheme info in session storage.
                selectedAuthScheme = "basicauth";
                self.updateAuthContainer();
            } else { // Display error message.
                $("[role='dialog'].modal .error_container").html(errMessage+"Please try again.").show();
            }
        } else if (parentClass.attr('data-role') == 'oauth2_modal') {
            var oauth2Url = window.location.href;
            oauth2Url = windowLocation.split("/resources/")[0];
            if (typeof Drupal != "undefined" && typeof Drupal.settings != "undefined") {
                oauth2Url = Drupal.settings.devconnect_docgen.apiModelBaseUrl + "/v1/o/" + Apigee.APIModel.organizationName + "/apimodels/"+ Apigee.APIModel.apiName+"/revisions/"+ Apigee.APIModel.revisionNumber;
            }
            if (Apigee.APIModel.apiModelBaseUrl) {
                oauth2Url = Apigee.APIModel.apiModelBaseUrl + "/v1/o/" + Apigee.APIModel.organizationName + "/apimodels/"+ Apigee.APIModel.apiName+"/revisions/"+ Apigee.APIModel.revisionNumber;
            }
            self.closeAuthModal();
            // Make an AJAX call to retrieve an auth URL.
            self.makeAJAXCall({"url":oauth2Url+"/authschemes/oauth2webserverflow/authUrl",dataType:"json", "callback":self.renderCallbackURL, "errorCallback" :self.handleOAuth2Failure});
        } else if (parentClass.attr('data-role') == 'custom_token_modal') {
            customTokenObject = {};
            customTokenObject.tokenType = ($("[data-role='custom_token_modal']").find("[data-role='header']").attr('checked') == "checked") ? "header" : "query";
            customTokenObject.tokenMap = {};
            $("[data-role='custom_token_row']").each(function() {
                customTokenObject.tokenMap[$(this).find("[data-role='name']").val()] = $(this).find("[data-role='value']").val();
            });
            sessionStorage.revisionsCustomTokenCredentialsDetails = apiName +"@@@"+ revisionNumber + "@@@" + JSON.stringify(customTokenObject);
            self.closeAuthModal(); // Close the auth modal.
            sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" + "customtoken"; // Store seleted auth scheme info in session storage.
            selectedAuthScheme = "customtoken";
            self.updateAuthContainer();
        } else if (parentClass.attr('data-role') == 'password_grant_modal' || parentClass.attr('data-role') == 'passwordgrant_modal') {
            var access_token = passwordGrantToken;
            var rememberCheckbox = $("[data-role='password_grant_modal']").find("#chk_remember").is(":checked");
            if (access_token) {
                if (rememberCheckbox) {
                    var date = new Date();
                    var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
                    localStorage.apisPasswordGrantCredentials = apiName + "@@@" + userEmail + "@@@Bearer " + access_token + "@@@" + dateString;
                } else {
                    localStorage.removeItem("apisPasswordGrantCredentials");
                    sessionStorage.apisPasswordGrantCredentials = apiName + "@@@" + userEmail + "@@@Bearer " + access_token; 
                }

                // TODO: show the icon to clear the storage- give that option

                /* closing dance */
                self.closeAuthModal(); 
                sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" + "passwordgrant"; // Store seleted auth scheme info in session storage.
                selectedAuthScheme = "passwordgrant";
                self.updateAuthContainer();
            } else {
                $("[role='dialog'].modal .error_container").html("Please fill out your basic credentials and get a token first!").show();
            }
        }
    };

    /**     // TODO: test this for extreme edge cases AND for different API calls (should work..)
     *  Takes original URL for authentication systems (basic, oauth, custom)  
     *  @param  {String} takes the original URL
     *  @return {String} returns properly formatted string for appending to moearthnetworks-test.apigee.net/purina/v1 + / + {string} 
     */
    this.formatURLforPWG = function(oldURL) {
        var newURL = "";        // holds new URL
        var comparator = "";    // holds 2 char comparator
        var copy = false;       // should the newURL start grabbing oldURL chars or not
        for (var i = 1; i < oldURL.length; i++) {
            if (copy)                           // if i can copy
                newURL += oldURL.charAt(i);
            if (!copy)                          // if i cant copy
                comparator = oldURL.charAt(i-1) + oldURL.charAt(i);
            if (!copy && comparator == "v1")    // if i cant copy and ive reached the correct comparator    
                copy = true;
        }
        return newURL;
    };

    this.getCustomTokenCredentials = function() {
        if (!isCutomTokenShown) {
            windowLocation = windowLocation.split("/resources/")[0];
            self.makeAJAXCall({"url":windowLocation+"/authschemes/custom",dataType:"json", "callback":self.renderCustomTokenCredentials, "errorCallback" :self.handleCustomTokenFailure});
            isCutomTokenShown = true;
        }
    };

    /**
     *  Takes a token, keeps the first n characters and appends an ellipsis.
     *  @param  {string}    original token
     *  @param  {integer}   how many characters we want to keep in the front
     *  @return {string}    n(token)...
     */
    this.truncateDisplay = function(string, n) {
        if (n < string.length-1) {
            var newToken = "";
            for (var i = 0; i < n; i++) {
                newToken += string.charAt(i);
            }
            newToken += "...";
            return newToken;
        }
        return "***";
    }

    /**
     * The request payload sample/request payload description link click event handler - Show/Hide payload sample content/request payload sample content, based on the link.
     */
    this.toggleRequestPayload = function(e) {
        var element = $(this);
        if (!element.parent().hasClass("active")) { // Do nothing, if user clicks on the active link.
            element.parent().siblings().removeClass("active");
            element.parent().addClass("active");
            var role = element.attr("data-role");
            var requestPayloadDocsElement = $("[data-role='request-payload-docs']");
            var requestPayloadExampleElement = $("[data-role='request-payload-example']");
            if (requestPayloadDocsElement.siblings("textarea").length) { // show/hide text are in inline edit use case.
                requestPayloadDocsElement.siblings("textarea").hide();
                requestPayloadDocsElement.siblings("a.allow_edit").hide();
            }
            if (requestPayloadExampleElement.siblings("a.allow_edit").length) {
                requestPayloadExampleElement.siblings("a.allow_edit").hide();
            }
            if (role =="docs-link") {
                requestPayloadExampleElement.hide();
                requestPayloadDocsElement.show();
            } else {
                requestPayloadDocsElement.hide();
                requestPayloadExampleElement.show();
            }
        }
    };

    /**
     * Click event handler for the reset link avaiable next to the send request button.
     */
    this.resetFields = function() {
        $("[data-role='query-param-list'],[data-role='header-param-list'],[data-role='body-param-list']").find("input").each(function() { // Empty the header/query input elements.
            $(this).val('');
        });
        $("[data-role='query-param-list'],[data-role='header-param-list']").each(function(i, obj) {
            var valueElement = $(this).find("[data-role='value']");
            valueElement.val(valueElement.attr('data-original-value'));
        });
        if ($('[data-role="request-payload-example"]').length) {
            var bodyPayloadElementValue = $('[data-role="request-payload-example"]').children('textarea').val();
            window.apiModelEditor.setRequestPayLoad(bodyPayloadElementValue);
        };
        $("#request_response_container .response").html("<p>Make a request and see the response.</p>");
        $("#request_response_container .request").html("<p>Make a request and see the response.</p>");
        rawCode = "";
        bodyContent = false;
    };

    /**
     * Click event handler for the send request button.
     * Constructs all necessary params and make an AJAX call to proxy or display validation error message.
     *  Supports all auth types: basicauth, oauth2, passwordgrant - makes request such that the webpage can render all metadata
     */
    this.sendRequest = function() {
        $("#working_alert").fadeIn(); // Show working alert message.
        self.updateAuthContainer();
        $("#request_response_container .response").html("<p>Make a request and see the response.</p>");
        $("#request_response_container .request").html("<p>Make a request and see the response.</p>");
        var templateInputElements = $("[data-role='method_url_container'] span.template_param");
        if (templateInputElements.length >= 1) { // Check if template param available.
            // Stores the template param name and values in local storage, if user modified the default template param value.
            // Loop through the template params and check against local stroage variable.
            if (localStorage.hasOwnProperty('templateParams')) {
                var templateParams = JSON.parse(localStorage.getItem('templateParams'));
                $("[data-role='method_url_container'] span.template_param").each(function() {
                    var inputElementName = $(this).siblings("span").attr('data-role');
                    var inputElementValue = $(this).text();
                    if (inputElementName == inputElementValue || inputElementValue == "" || $(this).html() == "&nbsp;") {
                        isTemplateParamMissing = true;
                        templateParamMissing.push(inputElementName.substring(1,inputElementName.length-1));
                        $(this).addClass('error');
                    }
                    var isModified = false;
                    for (var i=0; i<templateParams.length; i++) {
                        var paramName = templateParams[i].name;
                        var paramValue = templateParams[i].value;
                        if (inputElementName == paramName) {
                            isModified=true;
                        }
                        if(inputElementName == paramName && inputElementValue != paramValue && inputElementValue.length) {
                            templateParams[i].value = inputElementValue;
                        }
                    }
                    if (!isModified) {
                        templateParams.push({"name":inputElementName,"value":inputElementValue});
                    }
                });
                localStorage.setItem("templateParams",JSON.stringify(templateParams));
            } else {
                var templateParamArray = [];
                $("[data-role='method_url_container'] input").each(function() {
                var spanElement = $(this).siblings("span");
                    templateParamArray.push({"name":spanElement.attr("data-role"),"value":spanElement.html()});
                });
                localStorage.setItem("templateParams",JSON.stringify(templateParamArray)); // Create local storage variable and assign the values.
            }
        }

        //change the variable name to Target URL.
        var urlToTest = $("[data-role='method_url_container']").text();
        var methodVerb = $.trim($("[data-role='verb']").text().toLowerCase()); // Retrieve the verb from the HTML element.
        var headersList = [];
        // Loop through the header params and identify if required params are empty otherwise add header params in the list.
        if ($("[data-role='header-param-list']").length) {
            $("[data-role='header-param-list']").each(function(i, obj) {
                var headerParamName = $(this).find("[data-role='name']").text();
                var headerParamValue;
                if ($(this).find("[data-role='multiple-value']").length) {
                    headerParamValue = $(this).find("select option:selected").val();
                    headerParamValue = (headerParamValue == DEFAULT_OPTIONAL_PARAM_OPTION) ? "" : headerParamValue;
                } else {
                    headerParamValue = $(this).find("[data-role='value']").val();
                }
                headersList.push({"name" : headerParamName, "value" : headerParamValue});
                if ($(this).find("span.required").length && $(this).find("[data-role='value']").val() == "") {
                    isHeaderParamMissing = true;
                    headerParamMissing.push(headerParamName);
                    $(this).find("[data-role='value']").addClass('error');
                }
            });
        }
        var queryParamString = "";
        // Loop through the query params and identify if required params are empty otherwise add query params in the list.
        if ($("[data-role='query-param-list']").length >= 1) {
            var isFistParam = true;
            $("[data-role='query-param-list']").each(function(i, obj) {
                var queryParamName = $(this).find("[data-role='name']").text();
                var queryParamValue;
                if ($(this).find("[data-role='multiple-value']").length) {
                    queryParamValue = $(this).find("select option:selected").val();
                    queryParamValue = (queryParamValue == DEFAULT_OPTIONAL_PARAM_OPTION) ? "" : queryParamValue;
                } else {
                    queryParamValue = $(this).find("[data-role='value']").val();
                }
                
                if ($.trim(queryParamValue).length >= 1) {
                    var separator = (isFistParam) ? "" : "&";
                    queryParamString += separator + queryParamName + "=" + encodeURIComponent(decodeURIComponent(queryParamValue));
                    isFistParam = false;
                }
                
                if ($(this).find("span.required").length && queryParamValue == "") {
                    isQueryParamMissing = true;
                    queryParamMissing.push(queryParamName);
                    $(this).find("[data-role='value']").addClass('error');
                }
            });
        }
        var errorMessage = "";
        var paramGroups = $("[data-role='param-groups']");
        if (paramGroups.length) {
            paramGroups.each(function(i, obj) {
                var paramGroup = $(this);
                var maxChoice = (paramGroup.find("[data-role='maxChoice']").length) ? parseInt(paramGroup.find("[data-role='maxChoice']").text()) : paramGroup.find("[data-role='param-group-list']").length;
                var minChoice = (paramGroup.find("[data-role='minChoice']").length) ? parseInt(paramGroup.find("[data-role='minChoice']").text()) : 0;
                var counter = 0;
                var paramGroupMissing = [];
                if (paramGroup.find("[data-role='param-group-list']").length) {
                    paramGroup.find("[data-role='param-group-list']").each(function(i, obj) {
                        var paramGroupName = $(this).find("[data-role='name']").text();
                        var paramGroupValue = $(this).find("[data-role='value']").val();
                        var paramGroupType = $(this).find("[data-role='type']").text().toLowerCase();
                        if ($.trim(paramGroupValue).length >= 1) {
                            counter++;
                            if (paramGroupType == "query") {
                                var separator = ($.trim(queryParamString).length) ? "&" : "";
                                queryParamString += separator + paramGroupName + "=" + encodeURIComponent(decodeURIComponent(paramGroupValue));
                            } else if (paramGroupType == "header") {
                                headersList.push({"name" : paramGroupName, "value" : paramGroupValue});
                            }
                        } else {
                            paramGroupMissing.push($.trim(paramGroupName));
                        }
                    });
                }
                if (minChoice > counter) {
                    errorMessage += "Missing "+ (maxChoice-counter) +" value for parameter group of: <span>"+paramGroupMissing.join(", ")+"</span></br>";
                }
                if (counter > maxChoice) {
                    errorMessage += "Number of entered parmeters exceeds the maximum number of choices in the parameter group</br>";
                }
            });
        }
        if (customTokenObject.tokenType == "query") {
            var separator = (queryParamString != "") ? "&" : "";
            var index = 0;
            for (var key in customTokenObject.tokenMap) {
                separator = (index == 0 ) ? separator : "&";
                var customTokenName = key;
                var customTokenValue = customTokenObject.tokenMap[key];
                if($.trim(customTokenName) != "" && $.trim(customTokenValue) != "") {
                    queryParamString += separator + customTokenName + "=" + customTokenValue;
                    index++;
                }
            }
        } else {
            for (var key in customTokenObject.tokenMap) {
                var customTokenName = key;
                var customTokenValue = customTokenObject.tokenMap[key];
                if($.trim(customTokenName) != "" && $.trim(customTokenValue) != "") {
                    headersList.push({"name" : customTokenName, "value" : customTokenValue});
                }
            }
        }
        if ($.browser.msie && parseInt($.browser.version) <= 9 && $("[data-role='body-param-list']").length) {
            headersList.push({"name" : "Content-Type", "value" : "application/x-www-form-urlencoded"});
        }
        urlToTest = urlToTest.replace(/\{/g,"").replace(/\}/g,"");
        urlToTest = $.trim(urlToTest);
        queryParamString = $.trim(queryParamString);

        if (queryParamString != "") {
            var separator = "?";
            if (urlToTest.indexOf("?") != -1) {
                separator = "&"
            }
            urlToTest =  urlToTest + separator + queryParamString; // Append query params.
        }
        if (isTemplateParamMissing) {
            errorMessage += "Missing value for template parameter(s): <span>"+templateParamMissing.join(", ")+"</span></br>";
        }
        if (isQueryParamMissing) {
            errorMessage += "Missing value for required query parameter(s):&nbsp;<span>"+queryParamMissing.join(", ")+"</span></br>";
        }
        if (isHeaderParamMissing) {
            errorMessage += "Missing value for required header parameter(s):&nbsp;<span>"+headerParamMissing.join(", ")+"</span></br>";
        }
        if (errorMessage != "") { // Display error message, if any of the required param is missing.
            $("body").scrollTop(0);
            $("[data-role='error_container']").html(errorMessage).show();;
            self.clearMissingArray();
        }
        if (selectedAuthScheme  == "basicauth") { // Add basic details in send request proxy API call.
            if (basicAuth) {
                if(localStorage.apisBasicAuthDetails && apiName==localStorage.apisBasicAuthDetails.split("@@@")[0]) {
                    if (basicAuth != localStorage.apisBasicAuthDetails.split("@@@")[2]) {
                        basicAuth = localStorage.apisBasicAuthDetails.split("@@@")[2]
                        $("[data-role='basic_auth_container']").find(".link_open_basicauth").html(localStorage.apisBasicAuthDetails.split("@@@")[1]);
                    }
                }
                headersList.push({"name" : "Authorization", "value" : basicAuth});
                urlToTest = "http://moearthnetworks-test.apigee.net/purina/v1" + self.formatURLforPWG(urlToTest);

            }
        } else if (selectedAuthScheme  == "oauth2" && oauth2Credentials != null) {  // Add OAuth 2 details in send request proxy API call.
            if (localStorage.apisOAuth2CredentialsDetails && apiName==localStorage.apisOAuth2CredentialsDetails.split("@@@")[0]) {
                var credentialObj = $.parseJSON(localStorage.apisOAuth2CredentialsDetails.split("@@@")[1]);
                if (credentialObj.accessToken != oauth2Credentials.accessToken) {
                    oauth2Credentials = credentialObj;
                }
            } else if (oauth2Credentials.accessTokenType == "query") { // Add OAuth 2 details in the query param.
                var paramName = (oauth2Credentials.accessToeknParamName == "") ? "oauth_token" : oauth2Credentials.accessToeknParamName;
                var separator = (queryParamString == "") ? "?"  : "&";
                urlToTest += separator + paramName +"=" + oauth2Credentials.accessToken;
            } else if (oauth2Credentials.accessTokenType == "bearer") { // Add OAuth 2 details in headers.
                headersList.push({"name" : "Authorization", "value" : "Bearer " + oauth2Credentials.accessToken});
            }
        } else {

                // TODO: TEST this part - it makes the requests to the api, each one must be headed with bearererer auth
                // TODO: make sure passwordGrantCredentials is coming from the sessionStorage || if (checkbox) localStorage

            var rememberCheckbox = $("[data-role='password_grant_modal']").find("#chk_remember").is(":checked");
            var tok = "";
            var storage = {};
            if (rememberCheckbox && localStorage.apisPasswordGrantCredentials && apiName==localStorage.apisPasswordGrantCredentials.split("@@@")[0]) {
                tok = localStorage.apisPasswordGrantCredentials.split("@@@")[2];
                storage = localStorage;
            } else if (!rememberCheckbox && sessionStorage.apisPasswordGrantCredentials && apiName==sessionStorage.apisPasswordGrantCredentials.split("@@@")[0]) {
                tok = sessionStorage.apisPasswordGrantCredentials.split("@@@")[2];
                storage = sessionStorage;
            } else {
                storage = false;
                tok = "\n";
            }
            
            headersList.push({"name" : "Authorization", "value" : tok });

            urlToTest = "http://moearthnetworks-test.apigee.net/purina/v1" + self.formatURLforPWG(urlToTest);
        }

        // check if theres a bad authorization header
        var head = headersList[headersList.length-1].value; 
        if (head == "Bearer" || head == "Bearer " || head == "" || head == " ") {
            // TODO: show error here and dont let this request send
            $("error_container").val("Please choose an authentication method");
        } else {
            targetUrl = urlToTest;
            urlToTest = encodeURIComponent(urlToTest).replace(/\{.*?\}/g,"");
            urlToTest = Apigee.APIModel.proxyURL+"?targeturl="+urlToTest;

            // If a method has an attachment, we need to modify the standard AJAX the following way.
            var bodyPayload = null;
            var contentTypeValue = "application/x-www-form-urlencoded;charset=utf-8";
            var processDataValue = true;
            if ($("[data-role='attachments-list']").length || ($('[data-role="request-payload-example"]').length && $("[data-role='body-param-list']").length)) {
                var multiPartTypes = "";
                if ($.browser.msie && parseInt($.browser.version) <= 9) {
                    if (localStorage.getItem("unsupportedAttachmentFlag") == null) {
                        self.showUnsupportedAttachementAlertMessage();
                    }
                    $("#working_alert").fadeOut();
                    return;
                }
                if ($("[data-role='body-param-list']").length) {
                    var formParams = $("#formParams").serialize();
                    if (!$("#formAttachment input[name='root-fields']").length) {
                        $("#formAttachment").prepend('<input type="hidden" name="root-fields" value="'+formParams+'"/>');
                    } else {
                        $("#formAttachment input[name='root-fields']").val(formParams);
                    }
                    multiPartTypes = "param"; 
                    if ($('[data-role="request-payload-example"]').length || $("[data-role='attachments-list']").length) {
                        multiPartTypes += ($('[data-role="request-payload-example"]').length) ? "+text" : "";
                        multiPartTypes += ($("[data-role='attachments-list']").length) ? "+attachment" : "";
                        urlToTest += "&multiparttypes="+multiPartTypes;
                    }
                } else {
                    for (var i=0,l=headersList.length; i<l; i++) {
                        if (headersList[i].name == "Content-Type") {
                            headersList.splice(i,1);
                        }
                    }
                    if ($('[data-role="request-payload-example"]').length && $("[data-role='attachments-list']").length) {
                        urlToTest += "&multiparttypes=text+attachment";
                    }
                }

                if ($('[data-role="request-payload-example"]').length) {
                    if (!$("#formAttachment textarea[name='text']").length) {
                        if ($("#formAttachment input[name='root-fields']").length) {
                            $("<textarea class='hide' name='text'>"+window.apiModelEditor.getRequestPayLoad()+"</textarea>").insertAfter("#formAttachment input[name='root-fields']");
                        } else {
                            $("#formAttachment").prepend("<textarea class='hide' name='text'>"+window.apiModelEditor.getRequestPayLoad()+"</textarea>");
                        }    
                    } else {
                        $("#formAttachment textarea[name='text']").val(window.apiModelEditor.getRequestPayLoad());
                    }
                }
                if ($("#formParams").length) {
                    bodyPayload = new FormData($("form")[1]); // Create an arbitrary FormData instance
                } else {
                    bodyPayload = new FormData($("form")[0]); // Create an arbitrary FormData instance
                }
                contentTypeValue = false;
                processDataValue = false;
                
            } else if ($("[data-role='body-param-list']").length) {
                if ($("#formParams").length) {
                    bodyPayload = $("#formParams").serialize();
                } else {
                    bodyPayload = $("#formAttachment").serialize();
                }
            } else { // If a method does not have attach, use standard makeAJAXCall() method to send request.
                if ($('[data-role="request-payload-example"]').length) {
                    bodyPayload = window.apiModelEditor.getRequestPayLoad();
                }
            }
            self.makeAJAXCall({"url":urlToTest, "type":methodVerb, "data":bodyPayload, "callback":self.renderRequest, "headers":headersList, "contentType":contentTypeValue, "processData":processDataValue});            
        }
    };

    /**
     * Success/Error callback method of a send request proxy API call.
     * This methods fetches the response and show the headers, contents and other details in the request and response tab.
     * The request and response content are shown in Prism editor.
     */
    this.renderRequest = function(data) {
        var responseContainerElement = $("[data-role='response-container']");
        var requestContainerElement = $("[data-role='request-container']");
        if (data == "" || data == null) {
            requestContainerElement.html("<strong> An internal error has occurred. Please retry your request.</strong>");
            responseContainerElement.html("<strong> An internal error has occurred. Please retry your request.</strong>");
            return;
        }
        if (typeof data != "object") {
            data = $.parseJSON(data); // Parse the JSON.
        }
        rawCode = unescape(data.responseContent); // Stores response content.
        //rawCode = $.parseJSON(rawCode); //:TODO:: check the proxy and fix the issue and remove it.
        //rawCode = unescape(rawCode.responseContent); //:TODO:: check the proxy and fix the issue and remove it.
        // Response line fine details contruction.
        var responseContainerString = "<strong";
        var responseStatusCode;
        var httpVersion;
        var responseReasonPhrase;
        if (data.responseStatusCode) {
            responseStatusCode = data.responseStatusCode;
            httpVersion = data.httpVersion;
            responseReasonPhrase = data.responseReasonPhrase;
        } else {
            responseStatusCode = data.responseCode;
            httpVersion = data.messageVersion;
            responseReasonPhrase = data.responsePharse;
        }
        if (parseInt(responseStatusCode) >= 100 && parseInt(responseStatusCode) < 400) {
             responseContainerString += " class='success'";
        }
        responseContainerString += "> HTTP/"+httpVersion +" "+ responseStatusCode +"  "+ responseReasonPhrase+"</strong>";
        // Response headers construction.
        responseContainerString += "<dl>";


        for (var i=0; i<data.responseHeaders.length; i++) {
            responseContainerString +=  "<dt>";
            responseContainerString += unescape(data.responseHeaders[i].name);
            responseContainerString += ": </dt><dd>";
            responseContainerString += unescape(data.responseHeaders[i].value);
            responseContainerString +=  "</dd>";
        }
        responseContainerString += "</dl>";
        responseContainerElement.html(responseContainerString);

        // Response content construction.
        if (rawCode != "") {
            /**
                *  The below tries to extract a json string by checking if string already contains a double quote at the begin
                *  and end. To make sure, we do it for json we check additionally for presence of { or [ at the begin and },]
                *  at the end. The reason for doing this is that a Fix made earlier to obfuscate some credentials caused additional
                *  quotes to be introduced by The json library we use(JSONObject).
                *  For now, making these checks to get the underlying json.
            */
            var getAsJson = (/^"\{/.test(rawCode) && /\}"$/.test(rawCode)) || (/^"\[/.test(rawCode) && /\]"$/.test(rawCode));
            if (getAsJson) {
                /**
                    * Modified the regexp below to include scanning of new line character included part of json response.
                    * '.' regexp doesnt go past \n and hence some responses were not detected as json even though they were.
                    *  Reference bug: 22246
                */
                rawCode = rawCode.replace(/^"((.|\s)*)"$/, "$1");
            }
            if (rawCode) {
                var forJSON = true;
                try {
                    var tmp = $.parseJSON(rawCode);
                }
                catch (e) {
                    forJSON = false;
                }
                if (forJSON) { // Handle JSON response content.
                    var rawasjson = self.parseAndReturn(rawCode);
                    rawCode = JSON.stringify(rawasjson, null, 2);
                    rawCode = rawCode.replace("[{", "[\n  {");
                    rawCode = rawCode.replace(/,\n[\n ]*$/, "");
                    rawCode = rawCode.replace(/\n(\s*)},\n{/g, "\n$1},\n$1{");
                    responseContainerElement.append("<pre><code class='language-javascript' id='some-code123'>"+rawCode+"</code></pre>");
                } else { // Handle non JSON response content (treat as markup language)
                    rawCode =rawCode.replace(/>/g,"&gt;").replace(/</g,"&lt;");
                    responseContainerElement.append("<pre class='language-markup'><code class='language-markup' id='some-code'>"+rawCode+"</code></pre>");

                }
            }
        }

        // Request line fine details contruction.
        var hostName = targetUrl.split("//")[1].split("/")[0];
        


        var requestContainerString = "<strong>"+data.requestVerb+" "+ targetUrl.split(hostName)[1] + " HTTP/"+httpVersion+"</strong>";
        

        // Request headers construction.
        requestContainerString += "<dl>";
        for (var i=0; i<data.requestHeaders.length; i++) {
            var headerName = data.requestHeaders[i].name;
            if (headerName.toLowerCase() != "origin" && headerName.toLowerCase() != "referer") {
                var headerValue = data.requestHeaders[i].value;
                requestContainerString +=  "<dt>";
                requestContainerString += unescape(headerName);
                requestContainerString += ": </dt><dd>";
                requestContainerString += unescape(headerValue).replace(/</g,"&lt").replace(/>/g,"&gt");
                requestContainerString +=  "</dd>";
            }
        }
        requestContainerString += "</dl>";
        requestContainerElement.html(requestContainerString);
        // Resquest content construction.
        bodyContent = unescape(data.requestContent);
        bodyContent = bodyContent.replace(/[^\x00-\x7F]/g, "###");
        if(bodyContent.indexOf("###") != -1) {
            bodyContent = bodyContent.replace(bodyContent.substring(bodyContent.indexOf("###"),bodyContent.lastIndexOf("###")+3), "[BINARY DATA]");
        }
        if (bodyContent) {
            var forJSON = true;
            try {
                tmp = $.parseJSON(bodyContent);
            }
            catch (e) {
                forJSON = false;
            }
            if (forJSON) { // JSON request content.
                var rawasjson = self.parseAndReturn(bodyContent);
                bodyContent = JSON.stringify(rawasjson, null, 2);
                bodyContent = bodyContent.replace("[{", "[\n  {");
                bodyContent = bodyContent.replace(/,\n[\n ]*$/, "");
                bodyContent = bodyContent.replace(/\n(\s*)},\n{/g, "\n$1},\n$1{");
                requestContainerElement.append("<pre class='language-javascript'><code class='language-javascript' id='some-code'>"+bodyContent+"</code></pre>");
            } else { // Non JSON request content.
                bodyContent =bodyContent.replace(/>/g,"&gt;").replace(/</g,"&lt;");
                requestContainerElement.append("<pre class='language-markup'><code class='language-markup' id='some-code'>"+bodyContent+"</code></pre>");
            }
        }
        Prism.highlightAll(); // Update the Prism editor.
    };

    /**
     * This method clears the error container and it's related arrays and variable.
     */
    this.clearErrorContainer = function() {
        self.clearMissingBooleanVariables();
        self.clearMissingArray();
        $("[data-role='error_container']").hide().html("");
    };

    /**
     * This method clears the params variable.
     */
    this.clearMissingBooleanVariables = function() {
        isTemplateParamMissing = false;
        isHeaderParamMissing = false;
        isQueryParamMissing = false;
        isRequestBodyMissing = false;
    };

    /**
     * This method clears the params array.
     */
    this.clearMissingArray = function() {
        templateParamMissing = [];
        headerParamMissing = [];
        queryParamMissing = [];
        requestBodyMissing = "";
    };

    this.updateAuthModalFooter = function(modalClassName) {
        var localStorageVariable;
        switch(modalClassName) {
            case "basic_auth_modal": 
                localStorageVariable = "apisBasicAuthDetails";
                break;
            case "password_grant_modal":
            case "passwordgrant_modal":
                localStorageVariable = "apisPasswordGrantCredentials";
                break;
            default:
                localStorageVariable = "apisOAuth2CredentialsDetails";
                break;
        }

        if (localStorage.getItem(localStorageVariable)) {
            $("[data-role='"+modalClassName+"']").find(".modal-footer p").html('<input type="checkbox" checked id="chk_remember"> Remember credentials or token for 30 days.');
        } else if (!$("[data-role='"+modalClassName+"']").find(".modal-footer p input").length){
            $("[data-role='"+modalClassName+"']").find(".modal-footer p").append('<br><input type="checkbox" id="chk_remember"> Remember credentials or token for 30 days.');
        }
        $("[data-role='"+modalClassName+"']").modal('show');
    };

    /**
     * This method gets called after the successful OAuth 2 dance.
     * Display error message if any.
     * Stroe the OAuth 2 auth details in session storage.
     * Set OAuth 2 as seleted auth scheme.
     */
    this.setOAuth2Credentials = function(obj) {
        if (obj.errorMessage != "") { // Display error message if any.
            self.showError(obj.errorMessage);
        } else {
            oauth2Credentials = obj;
            selectedAuthScheme = "oauth2";
            var rememberCheckbox = $("[data-role='oauth2_modal']").find("#chk_remember").is(":checked");
            if (rememberCheckbox) {
                var date = new Date();
                var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
                localStorage.apisOAuth2CredentialsDetails = apiName +"@@@"+ JSON.stringify(oauth2Credentials)+ "@@@" + dateString;
            } else {
                localStorage.removeItem("apisOAuth2CredentialsDetails");
                sessionStorage.apisOAuth2CredentialsDetails = apiName +"@@@"+ JSON.stringify(oauth2Credentials); // Stroe the OAuth 2 auth details in session storage.
            }
            sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" +"oauth2"; // Set OAuth 2 as seleted auth scheme.
            self.updateAuthContainer();
        }
    };

    /**
     * The auth scheme container click event handler - sets clicked auth scheme as selected auth scheme.
     */
    this.toggleAuthScheme = function(e) {
        $("[data-role='authentication_container'] .well").removeClass("selected");
        $(this).addClass("selected");
        if ($(this).hasClass("basicauth")) {
            selectedAuthScheme = "basicauth";
        } else if ($(this).hasClass("oauth2")){
            selectedAuthScheme = "oauth2";
        } else if ($(this).hasClass("customtoken")){
            selectedAuthScheme = "customtoken";
        } else if ($(this).hasClass("passwordgrant")) {
            selectedAuthScheme = "passwordgrant";
        }
        sessionStorage.selectedAuthScheme = apiName +"@@@"+ revisionNumber + "@@@" + selectedAuthScheme;

    };

    /**
     * This method clears session storage variables.
     * @param {String} type A type of auth scheme (basicauth or oauth2).
     * @return {Void} clears session storage variables.
     */
    this.clearSessionStorage = function(type) {
        type = (typeof type.data == "undefined") ? type : type.data;
        if (type == "oauth2") {
            sessionStorage.removeItem('apisOAuth2CredentialsDetails');
            localStorage.removeItem('apisOAuth2CredentialsDetails');
            oauth2Credentials  = null;
            $("[data-role='oauth2_container']").find(".link_open_oauth2").html("Set...").attr('title','Set OAuth 2 credentials.');
            $("[data-role='oauth2_container']").find(".icon-remove").css('display','none');
        } else if (type == "basicauth"){
            basicAuth = "";
            userEmail = "";
            sessionStorage.removeItem('apisBasicAuthDetails');
            localStorage.removeItem('apisBasicAuthDetails');
            $("[data-role='basic_auth_container']").find(".link_open_basicauth").html("Set...").attr('title','Set basic auth credentials.');
            $("[data-role='basic_auth_container']").find(".icon-remove").css('display','none');
        } else if (type == "customtoken") {
            sessionStorage.removeItem('revisionsCustomTokenCredentialsDetails');
            $("[data-role='custom_token_container']").find(".link_open_customtoken").html("Set...").attr('title','Set custom token credentials.');
            $("[data-role='custom_token_container']").find(".icon-remove").css('display','none');
            isCutomTokenShown = false;
        } else if (type == "passwordgrant") {         // TODO: TEST this - it adds password grant support to this
            sessionStorage.removeItem('apisPasswordGrantCredentials');
            localStorage.removeItem('apisPasswordGrantCredentials');
            $("[data-role='password_grant_container']").find(".link_open_basicauth").html("Set...").attr('title','Set basic auth credentials.');
            $("[data-role='password_grant_container']").find(".icon-remove").css('display','none');
        }
        Apigee.APIModel.initMethodsAuthDialogsEvents(); // Re initialize events after the change.
    };
};

// The class/object Apigee.APIModel.Details extents Apigee.APIModel.Common.
Apigee.APIModel.Methods.prototype = new Apigee.APIModel.Common();

/**
 * This class handles operation page inline edit related functionalities.
 */
Apigee.APIModel.InlineEdit = function() {
    // Private properties
    var self = this; // Keep a reference of the current class when the context of 'this' is changing.
    var editMode = 0; // Holds the edit mode value
    var basicAuth; // Stores the basic auth info.
    var windowLocation = window.location.href; // Stores the window location URL.
    var currentEdiatableElement = null;
    var currentEdiatableElementValue = "";
    var editingFlag = false;
    var isAdminAuthModalReopened = false;
    var lastEditScope = "method";
    var descriptionEditFlag = false;
    //Private methods.
    /**
     * This method clears the inline edit basic auth session storage details.
     */
    function clearEditSessions() {
        sessionStorage.removeItem('basicAuth1');
        sessionStorage.removeItem('userEmail1');
    }

    function constructParams(paramType, scope) {
        var liEmenets;
        var typeVal;
        var paramString = "";
        templateParamAvailable = false;
        if (paramType == "general") {
            // Query and Header params construction.
            liEmenets = "[data-role='query-param-list'][data-scope='method'], [data-role='header-param-list'][data-scope='method']";
            if (scope == "resource") {
                liEmenets = "[data-role='query-param-list'][data-scope='resource'], [data-role='header-param-list'][data-scope='resource']";
            }
            // Template params construction.
            var searchTerm = "[data-scope='method']";
            if (scope == "resource") {
                searchTerm = "[data-scope='resource']";
            }
            $("[data-role='template-params']").find(searchTerm).each(function(index) {
                templateParamAvailable = true;
                paramString += '{"name" :"' + $(this).find("[data-role='name']").text() + '",';
                paramString += '"description" :"' + $(this).find("[data-role='description']").text() + '",';
                if ($(this).find("[data-role='required']").length) {
                    paramString += '"required" : ' + $(this).find("[data-role='required']").text() + ',';
                }
                if ($(this).find("[data-role='defaultValue']").length) {
                    paramString += '"defaultValue" :"' + $(this).find("[data-role='defaultValue']").text() + '",';
                }
                paramString += '"type" :"TEMPLATE",';
                paramString += '"dataType" :"string"}';
                var noOfParam = $("[data-role='template-params']").find(searchTerm).length;
                if (noOfParam > (index+1) ) {
                    paramString += ',';
                }
            });
        } else if (paramType ==  "body") {
            liEmenets = "[data-role='body-param-list'][data-scope='method']"
            if (scope == "resource") {
                liEmenets = "[data-role='body-param-list'][data-scope='resource']";
            }
            typeVal = "BODY";
        } else if (paramType == "attachments") {
            liEmenets = "[data-role='attachments-list']";
        }
        if (templateParamAvailable) {
            paramString += ","
        }
        $(liEmenets).each(function(index) {
            var currentLIElement = $(this);
            typeVal = paramType;
            if (paramType == "general") {
                typeVal = (currentLIElement.attr('data-role') == "query-param-list") ? "QUERY" : "HEADER";
            }
            var requiredParam = (currentLIElement.children(".title").find("[data-role='required']").text().indexOf("required") != -1) ? true : false;
            var paramName;
            var descriptionValue;
            if (currentLIElement.find("div.title input[data-role='value']").length) {
                paramName = $.trim(currentLIElement.find("div.title input[data-role='value']").val());
            } else {
                paramName = $.trim(currentLIElement.find("div.title span[data-role='name']").text());
            }
            if (currentLIElement.find("div.description textarea").length) {
                descriptionValue = $.trim(currentLIElement.find("div.description textarea").val());
            } else {
                descriptionValue = $.trim(currentLIElement.find("[data-role='description']").html());
                if (currentEdiatableElement.is(currentLIElement.find("[data-role='description']"))) {
                    descriptionValue = $.trim(currentLIElement.find("[data-role='description']").text());
                }
            }
            descriptionValue = JSON.stringify(descriptionValue);
            descriptionValue = descriptionValue.substring(1,descriptionValue.length-1); //Check if this required.
            descriptionValue = self.escapeSpecialChars(descriptionValue);
            paramString += '{"name" :"' + paramName + '",';
            paramString += '"description" :"' + descriptionValue + '",';
            paramString += '"required" : ' + requiredParam + ',';
            if (paramType == "attachments") {
                paramString += '"sampleFileUrl" : "' + $.trim(currentLIElement.find("[data-role='value']").attr('data-sample-file-url')) +'",';
                paramString += '"contentDisposition" : "' + $.trim(currentLIElement.find("[data-role='value']").attr('data-content-disposition')) + '"}';

            } else {
                paramString += '"type" :"'+ typeVal +'",';
                paramString += '"defaultValue" :"' + currentLIElement.find("[data-role='value']").val() + '",';
                paramString += '"dataType" :"string"}';
            }

            var noOfParam = $(liEmenets).length;
            if (noOfParam > (index+1) ) {
                paramString += ',';
            }

        });
        return paramString;
    }

    function constructParamGroups(scope) {
        var paramGroups = $("[data-role='param-groups'][data-scope='"+scope+"']");
        var paramString = "";
        if (paramGroups.length) {
            paramGroups.each(function(i, obj) {
                var paramGroup = $(this);
                paramString += '{';
                if (paramGroup.find("[data-role='maxChoice']").length) {
                  paramString += ' "maxChoice" : '+ parseInt(paramGroup.find("[data-role='maxChoice']").text());
                }
                if (paramGroup.find("[data-role='minChoice']").length) {
                    paramString += (paramGroup.find("[data-role='maxChoice']").length) ? "," : "";
                    paramString += '"minChoice" : '+ parseInt(paramGroup.find("[data-role='minChoice']").text());
                }
                paramString += ', "parameters" : [ ';
                //var choice = parseInt(paramGroup.find("[data-role='choice']").attr('data-choice'));
                //jsonBody += ' "choice" : '+choice+', "parameters" : [ ';
                if (paramGroup.find("[data-role='param-group-list']").length) {
                    paramGroup.find("[data-role='param-group-list']").each(function(index, obj) {
                        var currentLIElement = $(this);
                        var paramGroupName = $.trim(currentLIElement.find("[data-role='name']").text());
                        var paramGroupValue = $.trim(currentLIElement.find("[data-role='value']").val());
                        var paramGroupType = $.trim(currentLIElement.find("[data-role='type']").text());
                        paramGroupType = paramGroupType.toUpperCase();
                        var descriptionValue;
                        if (currentLIElement.find("div.description textarea").length) {
                            descriptionValue = $.trim(currentLIElement.find("div.description textarea").val());
                        } else {
                            descriptionValue = $.trim(currentLIElement.find("div.description").text());
                        }
                        descriptionValue = JSON.stringify(descriptionValue);
                        descriptionValue = descriptionValue.substring(1,descriptionValue.length-1); //Check if this required.
                        descriptionValue = self.escapeSpecialChars(descriptionValue);
                        paramString += '{"name" :"' + paramGroupName + '",';
                        paramString += '"defaultValue" :"' + paramGroupValue + '",';
                        paramString += '"type" :"'+ paramGroupType +'",';
                        paramString += '"description" :"' + descriptionValue + '",';
                        paramString += '"dataType" :"string"}';

                        var noOfParam = paramGroup.find("[data-role='param-group-list']").length;
                        if (noOfParam > (index+1) ) {
                            paramString += ',';
                        }
                    });
                    paramString += ']';
                }
                paramString += '}';
                if (paramGroups.length > (i+1) ) {
                    paramString += ',';
                }

            });
        }
        return paramString;
    }

    function updateParms(currentLIElement, data) {
        var paramName = $.trim(currentLIElement.find("[data-role='name']").text());
        var paramStyle = "";
        var paramObject;
        if (currentLIElement.attr('data-role') == 'query-param-list') {
            paramStyle = "QUERY";
            paramObject = data.parameters;
        } else if (currentLIElement.attr('data-role') == 'header-param-list') {
            paramStyle = "HEADER";
            paramObject = data.parameters;
        } else if (currentLIElement.attr('data-role') == 'body-param-list') {
            paramStyle = "BODY";
            if(data.body) {
                paramObject = data.body.parameters;
            }
        } else if (currentLIElement.attr('data-role') == 'attachments-list') {
            paramStyle = "ATTACHMENT";
            if(data.body) {
                paramObject = data.body.attachments;
            }
        } else if (currentLIElement.attr('data-role') == 'response_errors_list') {
            paramStyle = "ERRORS";
            if (data.response) {
                paramObject = data.response.errors;
            }
        }
        if (paramObject) {
            for (var i=0,len = paramObject.length; i<len; i++) {
                var param  = paramObject[i];
                if (paramStyle == "QUERY" || paramStyle == "HEADER") {
                    if (param.name == paramName && param.type == paramStyle) {
                        currentLIElement.find("[data-role='description']").html(param.description);
                    }
                } else {
                    if (param.name == paramName) {
                        currentLIElement.find("[data-role='description']").html(param.description);
                    }
                }
            }
        }
    }

    function checkAdminCredentials() {
        if (localStorage.orgAdminBasicAuthDetails) {
            $("[data-role='edit_auth_modal']").find(".modal-footer p").html('<input type="checkbox" checked id="chk_remember"> Remember credentials for 30 days.');
        } else if (!$("[data-role='edit_auth_modal']").find(".modal-footer p input").length){
            $("[data-role='edit_auth_modal']").find(".modal-footer p").append('<br><input type="checkbox" id="chk_remember"> Remember credentials for 30 days.');
        }
        $("[data-role='edit_auth_modal']").modal('show'); // Open pop up basic authentication dialog.
    }

    //Public methods.
    /**
     * This method initilize the edit mode based on the mode.
     * @param {Int} mode - Mode type. type 1 provides basic edit functionalities 2 provides advance edit.
     * @return {Void} checks whether user already signed in or not using session storage variable.
     * If yes, stores the basic auth details in local variable and construct the inline edit mode.
     * If no, opens pop up basic authentication dialog and stores the basic auth details in local variable and construct the inline edit mode.
     */
    this.init = function(mode) {
        editMode = mode;
        if (sessionStorage.orgAdminBasicAuthDetails || localStorage.orgAdminBasicAuthDetails) {
            self.showAdminAuthenticationSection(); // Store the basic auth details in local variable.
        } else {
            checkAdminCredentials();
        }
        Apigee.APIModel.initInlineEditAdminAuthEvents();
    };

    /**
     *
     *
     */
    this.

    /**     // TODO: make a method that accomplishes the same thing for password grant
     * The method handles saving basic auth details/displays error to user, when user clicks 'Save' button in the Inline edit Basic Auth pop-up dialog.
     */
    this.saveAuthModal = function() {
        var errMessage = self.validate;
        Fields('edit_auth_modal');
        if (errMessage == "") {
            var windowLocation = window.location.href;
            var dataObj = "password="+ $.trim($("[data-role='edit_auth_modal']").find("#inputPassword").val());
            if (Apigee.APIModel.authUrl != "null") {
                var authUrl = Apigee.APIModel.authUrl.replace("{user}",encodeURIComponent(userEmail));
                var headersList = [];
                headersList.push({"name" : "Content-Type", "value" : "application/x-www-form-urlencoded"});
                self.makeAJAXCall({"url": Apigee.APIModel.proxyURL+"?targeturl="+authUrl,type:"post",dataType:"json",data:dataObj,"callback":self.saveAdminCredentials, "errorCallback" :self.showUnauthorizedInfo,"headers":headersList });
            } else {
                self.saveAdminCredentials();
            }
        } else {
            $("[data-role='edit_auth_modal'] .error_container").html(errMessage+"Please try again.").show();
        }
    };

    // TODO: add password grant to this
    this.saveAdminCredentials = function() {
        basicAuth = "Basic "+$.base64Encode(userEmail+':'+ $.trim($("[data-role='edit_auth_modal']").find("#inputPassword").val()));
        var rememberCheckbox = $("[data-role='edit_auth_modal']").find("#chk_remember").is(":checked");
        if (rememberCheckbox) {
            var date = new Date();
            var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
            localStorage.orgAdminBasicAuthDetails = basicAuth + "@@@" + userEmail + "@@@" + dateString; // Store basic auth info in session storage.
        } else {
            localStorage.removeItem("orgAdminBasicAuthDetails");
            sessionStorage.orgAdminBasicAuthDetails = basicAuth + "@@@" + userEmail;  // Store basic auth info in local storage with time stamp.
        }
        self.closeAuthModal();
        self.showAdminAuthenticationSection();
    };

    this.showUnauthorizedInfo = function(errorCode) {
        if (errorCode == "401") {
            $("[data-role='edit_auth_modal'] .error_container").html("Invalid credentials. Please try again.").show();
        } else {
            $("[data-role='edit_auth_modal'] .error_container").html("Error saving details. Please try again.").show();
        }
    };

    /**
     * The method shows the info about logged in users and provide clear and reset functionlities.
     */
    this.showAdminAuthenticationSection = function() {
        var orgAdminCredentials = "";
        if (localStorage.orgAdminBasicAuthDetails) {
            var date = new Date();
            var dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
            var lsTimeStamp  = localStorage.orgAdminBasicAuthDetails.split("@@@")[2]
            var currentTimeStamp = dateString;
            var dtDiff = parseInt(self.dateDiff(new Date(currentTimeStamp),new Date(lsTimeStamp)));
            if (dtDiff > 30) {
                localStorage.removeItem("orgAdminBasicAuthDetails");
                checkAdminCredentials();
            } else {
                orgAdminCredentials = localStorage.orgAdminBasicAuthDetails;
            }
        } else if (sessionStorage.orgAdminBasicAuthDetails) {
            orgAdminCredentials = sessionStorage.orgAdminBasicAuthDetails;
        }
        if (orgAdminCredentials !== "") {
            basicAuth = orgAdminCredentials.split("@@@")[0];
            var emailString = orgAdminCredentials.split("@@@")[1];
            $(".admin_auth_section a.auth_admin_email").html(emailString).show();
            $(".admin_auth_section .icon-remove").css('display','inline-block');
            $(".admin_auth_section").show().removeClass("hide");
        } else {
            localStorage.removeItem("orgAdminBasicAuthDetails")
            sessionStorage.removeItem("orgAdminBasicAuthDetails");
            $(".admin_auth_section a.auth_admin_email").html("").hide();
            $(".admin_auth_section .icon-remove").hide();
            $(".admin_auth_section").show().removeClass("hide");;
        };
        if (!isAdminAuthModalReopened) {
            self.constructEditMode();
        }
    };
    /**
     * The method clears the inline edit basic auth related session storage and reset the HTML element.
     */
    this.clearAdminAuthDetails = function() {
        clearEditSessions();
        $(this).siblings("a.auth_admin_email").html("").hide();
        $(this).hide();
    };
    /**
     * The method handles reseting the inline edit basic auth.
     */
    this.reOpenAdminAuthDetails = function() {
        isAdminAuthModalReopened = true;
        clearEditSessions();
        checkAdminCredentials();
        Apigee.APIModel.initInlineEditAdminAuthEvents();
    };
    /**
     * The method handles constructing the inline edit HTML elements and invokes the necessary methods.
     * Idetify the editable element based on the mode.
     * Append the allow_edit, ok and cancel elements to the editable elements.
     * Append textarea to method desction, request payload sample, response payload sample elements.
     */
    this.constructEditMode = function() {
        $("#method_content").addClass("edit_mode");
        var editIconHTML = '<a class="allow_edit hover"></a><a class="allow_edit ok" title="save and quit."></a><a class="allow_edit cancel" title="reset and quit."></a>';
        $(".edit_mode .resource_details").parent().addClass("clearfix");
        $(".edit_mode .resource_details").children("div").addClass("clearfix");
        $("[data-role='method-title']").parent().append(editIconHTML).addClass("clearfix");
        $(".description_container").addClass("clearfix");
        $("ul.method_table").parent().css({"clear":"both"});
        // Append edit HTML to header and query params.
        if ($("[data-role='query-param-list'],[data-role='header-param-list'], [data-role='body-param-list'], [data-role='param-group-list'], [data-role='response_errors_list'], [data-role='attachments-list'] ").length) {
            $("[data-role='query-param-list'],[data-role='header-param-list'], [data-role='body-param-list'], [data-role='param-group-list'], [data-role='response_errors_list'], [data-role='attachments-list']").each(function(i, obj) {
                $(this).find("[data-role='description']").parent().append(editIconHTML);
            });
        }
        //$("[data-scope='resource']").find("[data-role='description']").removeAttr("data-allow-edit"); // Remove edit mode to resource level params.
        // Request payload description related changes.
        $(".description_container").append('<textarea class="resource_description_edit">'+$("[data-role='method-description']").html()+'</textarea>'+editIconHTML);
        var requestPayLoadDocsContainer = $("[data-role='request-payload-docs']");
        requestPayLoadDocsContainer.wrap("<div class='clearfix'></div>");
        requestPayLoadDocsContainer.attr("data-allow-edit","true");
        requestPayLoadDocsContainer.parent().append('<textarea class="request_payload_doc_edit"></textarea>'+editIconHTML);
        // Request payload sample related changes.
        var requestPayLoadExampleContainer = $("[data-role='request-payload-example']");
        requestPayLoadExampleContainer.wrap("<div class='clearfix'></div>")
        requestPayLoadExampleContainer.attr("data-allow-edit","true").width(600).css({'float':'left'});
        requestPayLoadExampleContainer.parent().append(editIconHTML);
        // Response payload description related changes.
        var responsePayLoadDocsContainer = $("[data-role='response-payload-docs']");
        responsePayLoadDocsContainer.wrap("<div class='clearfix'></div>");
        responsePayLoadDocsContainer.attr("data-allow-edit","true");
        responsePayLoadDocsContainer.parent().append('<textarea class="response_payload_doc_edit"></textarea>'+editIconHTML);
        Apigee.APIModel.inlineEditPageEvents();
    };

    /**
     * The Mouse over event handler for editable element, shows the edit icon.
     */
    this.handleEditPropertiesMouseOver = function() {
        var dataRole = $(this).attr("data-role");
        if (!$(this).hasClass("editing")) {
            $(this).addClass('edit');
            $(this).siblings("a.allow_edit.hover").css({'display':'inline-block'});
        }
    };

    /**
     * The Mouse out event handler for editable element, hides the edit icon.
     */
    this.handleEditPropertiesMouseOut = function() {
        var dataRole = $(this).attr("data-role");
        if (!$(this).hasClass("editing")) {
            $(this).removeClass('edit');
            $(this).siblings("a.allow_edit.hover").hide();
        }
    };

    /**
     * Editable elements click event handler.
     * Makes the current element as editable element. Shows OK, Cancel icon,
     */
    this.handleEditableElementsClick = function(e) {
        var dateRoleFlag = false;
        if(currentEdiatableElement) {
            if ($(this).attr('data-role') == "description" && !currentEdiatableElement.is($(this))) {
                dateRoleFlag = true;
            } else {
                dateRoleFlag = currentEdiatableElement.attr('data-role')!=$(this).attr('data-role')
            }
        }
        $("[data-role='error_container']").hide().html("");
        if (currentEdiatableElementValue != "" && editingFlag && currentEdiatableElement != null && dateRoleFlag ) {
            var previsionEditableElementValue = $.trim(currentEdiatableElement.text());
            if (currentEdiatableElement.siblings("textarea").length) {
                previsionEditableElementValue = $.trim(currentEdiatableElement.siblings("textarea").val());
            }
            if (currentEdiatableElementValue != previsionEditableElementValue) {
                $("[data-role='confirm_modal']").modal('show');
                Apigee.APIModel.initInlineEditAdminAuthEvents();
            } else if (!currentEdiatableElement.is($(this))) {
                self.resetEditableElement();
            }
        } else {
            currentEdiatableElement = $(this);
            if (!descriptionEditFlag && $(this).attr('data-role') == 'description') {
                currentEdiatableElement.text(currentEdiatableElement.html());
                descriptionEditFlag = true;
            }
            currentEdiatableElementValue = $.trim($(this).text());
            if ($(this).hasClass("resource_description") || $(this).attr('data-role') == "request-payload-docs" || $(this).attr('data-role') == "response-payload-docs") {
                currentEdiatableElementValue = $.trim($(this).html());
                $(this).hide();
$(this).siblings("textarea").val($.trim($(this).html())).height($(this).height()+30).show();
                $(this).siblings("textarea").focus();
                $(this).siblings("textarea").unbind("click").click(function() {
                    return false;
                });
                Apigee.APIModel.initInlineEditAdminAuthEvents();
            }
            if ($(this).attr('data-role') == "method-title" || $(this).attr('data-role') == 'description') {
                $(this).attr('contenteditable','true');
            } else {
                $("[data-role='method-title']").removeAttr('contenteditable');
            }
            $(this).addClass("editing");
            // Hide other editable elements icons.
            $(this).siblings("a.allow_edit.hover").hide();
            // Show OK, Cancel icon to current element.
            $(this).siblings('a.allow_edit.ok').show();
            $(this).siblings('a.allow_edit.cancel').show();
            $(this).addClass("edit"); // Add a class called 'edit'.
            editingFlag = true;
            $(this).focus();
        }
        e.preventDefault();
        return false;
    };

    this.resetEditableElement = function() {
        descriptionEditFlag = false;
        editingFlag = false;
        currentEdiatableElement.removeClass("editing");
        currentEdiatableElement.siblings("a.allow_edit").hide();
        currentEdiatableElement.html(currentEdiatableElementValue);

        if (currentEdiatableElement.attr('data-role') == 'description') {
            currentEdiatableElement.html(currentEdiatableElementValue);
        }
        if (currentEdiatableElement.attr('data-role') == "method-description") {
            $("textarea.resource_description_edit").val(currentEdiatableElementValue)
        }
        currentEdiatableElement.removeClass("edit").removeClass("editing");
        if (currentEdiatableElement.hasClass("resource_description") || currentEdiatableElement.attr('data-role') == "request-payload-docs" || currentEdiatableElement.attr('data-role') == "response-payload-docs") {
            //currentEdiatableElement.hide();
            currentEdiatableElement.siblings("textarea").hide();
            currentEdiatableElement.show();
        }
        currentEdiatableElementValue = "";
        return false;
    }

    this.documentClickHandler = function() {
        descriptionEditFlag = false;
        if(currentEdiatableElement) {
            currentEdiatableElement.removeClass("editing");
        }
        if (currentEdiatableElementValue != "" && $("body").children("[role='dialog'].modal").is(":visible") == false) {
            $("[data-role='confirm_modal']").modal('show');
            Apigee.APIModel.initInlineEditAdminAuthEvents();
        }
    }

    this.handleConfirmDialogSave = function() {
        descriptionEditFlag = false;
        currentEdiatableElement.siblings("a.allow_edit.ok").trigger("click");
        self.closeAuthModal();
        Apigee.APIModel.initInlineEditAdminAuthEvents();
        currentEdiatableElementValue = "";
        return false;
    };
    /**
     * Click event handler for the OK/Cancel icon.
     * If it is OK icon, Constructs all necessary params and make an AJAX call to update the modified values.
     * If it is Cancel icon, Resets the editable elements value.
     */
    this.makeAPICall = function(e) {
        var operationPath = location.href;
        editingFlag = false;
        currentEdiatableElement.removeClass("editing");
        var jsonBody = '';
        if (currentEdiatableElement.attr("data-role") == "description" && currentEdiatableElement.parent().parent().attr("data-scope") == "resource") {
            lastEditScope = "resource";
            operationPath = operationPath.split("/methods/")[0];
            if (typeof Drupal != "undefined" && typeof Drupal.settings != "undefined") {
                // operationPath = Drupal.settings.devconnect_docgen.apiModelBaseUrl + "/v1/" + Apigee.APIModel.organizationName + "/apimodels/"+ Apigee.APIModel.apiName+"/revisions/"+ Apigee.APIModel.revisionNumber+"/resources/"+ Apigee.APIModel.resourceId;
                operationPath = Drupal.settings.devconnect_docgen.apiModelBaseUrl + "/v1/o/" + Apigee.APIModel.organizationName + "/apimodels/"+ Apigee.APIModel.apiName+"/revisions/"+ Apigee.APIModel.revisionNumber+"/resources/"+ Apigee.APIModel.resourceId;
            }
            if (Apigee.APIModel.apiModelBaseUrl) {
                operationPath = "/v1/" + Apigee.APIModel.organizationName + "/apimodels/"+ Apigee.APIModel.apiName+"/revisions/"+ Apigee.APIModel.revisionNumber+"/resources/"+ Apigee.APIModel.resourceId;
                operationPath = Apigee.APIModel.apiModelBaseUrl + "/v1/" + Apigee.APIModel.organizationName + "/apimodels/"+ Apigee.APIModel.apiName+"/revisions/"+ Apigee.APIModel.revisionNumber+"/resources/"+ Apigee.APIModel.resourceId;
            }

            // Resource level params Header, Query, Template params contruction.
            jsonBody += '{"parameters": [' + constructParams("general","resource") + ' ]';
            jsonBody += ', "parameterGroups": [ ' + constructParamGroups("resource") + ' ]}';
        } else {
            lastEditScope = "method";
            operationPath = operationPath.split("/doc?")[0]
            if (typeof Drupal != "undefined" && typeof Drupal.settings != "undefined") {
                operationPath = Drupal.settings.devconnect_docgen.apiModelBaseUrl + "/v1/o/" + Apigee.APIModel.organizationName + "/apimodels/"+Apigee.APIModel.apiName+"/revisions/"+Apigee.APIModel.revisionNumber+"/resources/"+Apigee.APIModel.resourceId+"/methods/"+ Apigee.APIModel.methodId;
            }
            if (Apigee.APIModel.apiModelBaseUrl) {
                operationPath = Apigee.APIModel.apiModelBaseUrl + "/v1/o/" + Apigee.APIModel.organizationName + "/apimodels/"+Apigee.APIModel.apiName+"/revisions/"+Apigee.APIModel.revisionNumber+"/resources/"+Apigee.APIModel.resourceId+"/methods/"+ Apigee.APIModel.methodId;
            }
            // Description text construction.
            var descriptionText =  $.trim($("textarea.resource_description_edit").val());
            if (currentEdiatableElement.attr("data-role") != "method-description") {
                descriptionText =  $.trim($(".resource_description ").html());
            }
            
            // Authentication value construction.
            var authenticationValue = $("[data-role='auth-type']").text()

            authenticationValue = authenticationValue.replace("Basic Auth","BASICAUTH").replace("Custom Token","CUSTOM").replace( "OAuth 1","OAUTH1WEBSERVER").replace("OAuth 1 Client Credentials","OAUTH1CLIENTCREDENTIALS").replace("OAuth 2","OAUTH2WEBSERVER").replace("OAuth 2 Client Credentials","OAUTH2CLIENTCREDENTIALS").replace("OAuth 2 Implicit Grant Flow","OAUTH2IMPLICITGRANT").replace("No auth","NOAUTH").replace("Password Grant", "PASSWORDGRANT");
            var authtenticationString = "";
            if (authenticationValue.split(",").length > 1) {
                authtenticationString = '[';
                for (var i=0; i<authenticationValue.split(",").length; i++) {
                 authtenticationString += '"'+   authenticationValue.split(",")[i] + '"';
                 if (i != (authenticationValue.split(",").length-1) ) {
                    authtenticationString += ",";
                 }
                }
                authtenticationString += ']';

            } else {
                authtenticationString = '[ "'+ authenticationValue + '" ]';
            }
            //authtenticationString = authtenticationString.replace("NOAUTH","PUBLIC");
            // Categories value construction.
            var categoriesValue = $.trim($("[data-role='category']").text());
            var categoriesString = "";
            if (categoriesString.split(",").length > 1) {
                categoriesString = '[';
                for (var i=0; i<categoriesValue.split(",").length; i++) {
                 categoriesString += '"'+   categoriesValue.split(",")[i] + '"';
                 if (i != (categoriesValue.split(",").length-1) ) {
                    categoriesString += ",";
                 }
                }
                categoriesString += ']';
            } else {
                categoriesString = '[ "'+ categoriesValue + '" ]';
            }
            // Stringify the description, remove quotes and escape the special charectes.
            descriptionText = JSON.stringify(descriptionText);
            descriptionText = descriptionText.substring(1,descriptionText.length-1); //Check if this required.
            descriptionText = self.escapeSpecialChars(descriptionText)
            // Construct the AJAX method body.
            jsonBody = '{ "displayName":"'+ $.trim($("[data-role='method-title']").html()) +'", "description": "' + descriptionText  + '","verb": "'+$.trim($("[data-role='verb']").text()) + '",';
            jsonBody += '"authSchemes" : ' + authtenticationString + ', "tags" : ' + categoriesString;
            var contentTypeValue  = "";
            //jsonBody += ' "request": { ';
            if ($.trim($("[data-role='content-type']").text()) != "N.A.") {
                //jsonBody += '"contentType" : "'+ $.trim($("[data-role='content-type']").text()) + '",';
                contentTypeValue = $.trim($("[data-role='content-type']").text());
            }
            //jsonBody += '}';
            // Header, Query params contruction excluding the resource level params.
            var paramString = constructParams("general");
            if (paramString.length) {
                if (paramString.charAt(paramString.length-1) === ",") {
                    paramString = paramString.substring(0,(paramString.length-1));
                }
                jsonBody += ', "parameters": [' + paramString + ' ]';
            }

            jsonBody += ', "parameterGroups": [ ' + constructParamGroups("method") + ' ]';

            jsonBody += ', "body": {';
            jsonBody += '"parameters": [';
            jsonBody += constructParams('body');
            jsonBody += ' ]';

            jsonBody += ', "attachments": [';
            jsonBody += constructParams('attachments');
            jsonBody += ' ]';


            jsonBody += ', "contentType":"' + contentTypeValue + '"';
            // Request payload sample contruction.
            if ($('[data-role="request-payload-example"]').length) {
                var requestPayload = JSON.stringify(window.apiModelEditor.getRequestPayLoad());
                requestPayload = requestPayload.substring(1,requestPayload.length-1); //Check if this required.
                requestPayload = self.escapeSpecialChars(requestPayload)
                //jsonBody += ', "requestBody": "' + requestPayload +'"';
                jsonBody += ', "sample" :"'+requestPayload +'"';
            }

            //jsonBody += '"customAttributes" : [';
            // Request/Response payload description construction.
            var requestPayloadDocElement = $("[data-role='request-payload-docs']");
            var responsePayloadDocElement = $("[data-role='response-payload-docs']");
            var requestPayloadDocValue = "";
            var responsePayloadDocValue = "";

            if (requestPayloadDocElement.length) {
                var requestPayloadDocValue = $.trim(requestPayloadDocElement.html());
                if (requestPayloadDocElement.siblings("textarea").is(":visible") == true) {
                    requestPayloadDocValue =  $.trim(requestPayloadDocElement.siblings("textarea").val());
                }
                requestPayloadDocValue = JSON.stringify(requestPayloadDocValue);
                requestPayloadDocValue = requestPayloadDocValue.substring(1,requestPayloadDocValue.length-1); //Check if this required.
                requestPayloadDocValue = self.escapeSpecialChars(requestPayloadDocValue);
                //requestPayloadDocValue = ', "request": { "doc": "' + requestPayloadDocValue + '" } ';
                requestPayloadDocValue = ', "doc": "' + requestPayloadDocValue + '" ';
                jsonBody += requestPayloadDocValue;
            }
            jsonBody += ' }';
            var reponseErrorsElement = $("[data-role='response_errors_list']");
            if (responsePayloadDocElement.length || reponseErrorsElement.length) {
                jsonBody += ', "response": {';
                if (responsePayloadDocElement.length) {
                    var responsePayloadDocValue = $.trim(responsePayloadDocElement.html());
                    if (responsePayloadDocElement.siblings("textarea").is(":visible") == true) {
                        responsePayloadDocValue =  $.trim(responsePayloadDocElement.siblings("textarea").val());
                    }
                    responsePayloadDocValue = JSON.stringify(responsePayloadDocValue);
                    responsePayloadDocValue = responsePayloadDocValue.substring(1,responsePayloadDocValue.length-1); //Check if this required.
                    responsePayloadDocValue = self.escapeSpecialChars(responsePayloadDocValue);

                    var responsePayload = JSON.stringify($("[data-role='response-payload']").val());
                    responsePayload = responsePayload.substring(1,responsePayload.length-1); //Check if this required.
                    responsePayload = self.escapeSpecialChars(responsePayload);
                    jsonBody += '"doc": "' + responsePayloadDocValue + '"  ,"sample" : "' + responsePayload + '", "contentType" : "' + $("[data-role='response-content-type']").text() + '"';
                }
                if (reponseErrorsElement.length) {
                    var paramString = '';
                    $(reponseErrorsElement).each(function(index) {
                        var currentElement = $(this);
                        paramString += '{"httpStatusCode" :"' + $.trim(currentElement.find("[data-role='http_status_code']").html()) + '",';
                        paramString += '"code" : "' + $.trim(currentElement.find("[data-role='code']").html()) + '",';
                        paramString += '"description" :"' + $.trim(currentElement.find("[data-role='description']").html()) + '"}';
                        var noOfParam = $(reponseErrorsElement).length;
                        if (noOfParam > (index+1) ) {
                            paramString += ',';
                        }
                    });
                    if (responsePayloadDocElement.length) {
                        jsonBody += ',';
                    }
                    jsonBody += '"errors" : [' + paramString + ']';
                }
                jsonBody += '}';
            }
            jsonBody += '}';
        }
        var headersList = [];
        if(localStorage.orgAdminBasicAuthDetails) {
            if (basicAuth != localStorage.orgAdminBasicAuthDetails.split("@@@")[0]) {
                basicAuth = localStorage.orgAdminBasicAuthDetails.split("@@@")[0];
                $(".admin_auth_section a.auth_admin_email").html(localStorage.orgAdminBasicAuthDetails.split("@@@")[1]);
            }
        }
        headersList.push({"name" : "Authorization", "value" : basicAuth});
        headersList.push({"name" : "Content-Type", "value" : "application/json"});
        $("#working_alert").fadeIn();
        operationPath = Apigee.APIModel.proxyURL+"?targeturl="+operationPath;
        self.makeAJAXCall({"url":operationPath,type:"put",dataType:"json","headers": headersList, data:jsonBody,"callback":self.handleAPICallSuccess, "errorCallback" :self.handleUpdateFailure });

        $(this).siblings("[contenteditable='true']").removeClass("edit");
        $(this).siblings("a.allow_edit.cancel").hide();
        $(this).siblings("a.allow_edit.ok").hide();
        if ($(this).siblings("textarea").is(":visible")) {
            $(this).siblings("textarea").hide();
            $(this).siblings("[data-allow-edit='true']").html($(this).siblings("textarea").val()).removeClass("edit").removeClass("editing").show();
        }
        $(this).hide();
        e.stopPropagation();
        return false;
    };

    /**
     * Inline edit update AJAX call success handler.
     * Updates the modified values .
     */
    this.handleAPICallSuccess = function(data) {
        descriptionEditFlag = false;
        data = unescape(data.responseContent);
        data = JSON.parse(data);
        currentEdiatableElementValue = $.trim(currentEdiatableElement.html());
        $("[data-role='method-title']").html(data.displayName);
        $("[data-role='method-description']").html(data.description); // Set the description.
        // Set the query/header param values.
        $("[data-role='query-param-list'], [data-role='header-param-list'], [data-role='body-param-list'], [data-role='response_errors_list'], [data-role='attachments-list']").each(function(index) {
            updateParms($(this), data)
        });
        if (typeof Drupal != "undefined" && typeof Drupal.settings != "undefined") {
            var windowURL = window.location.href;
            var drupalURL = windowURL = windowURL.replace("?editMode=1","?flush=1").replace("?editMode=2","?flush=1");
            self.makeAJAXCall({"url":drupalURL, "callback":self.drupalUpdateSuccess});
        }
        currentEdiatableElementValue = "";
    };
    this.drupalUpdateSuccess = function() {
    }
    this.handleUpdateFailure = function() {
        self.resetEditableElement();
        self.showError("Error saving changes.");
    };
};

Apigee.APIModel.InlineEdit.prototype = new Apigee.APIModel.Common(); 