/*
 * Copyright (c) 2013, Apigee Corporation. All rights reserved.
 * Apigee(TM) and the Apigee logo are trademarks or
 * registered trademarks of Apigee Corp. or its subsidiaries. All other
 * trademarks are the property of their respective owners.
 * ---------------------------------------------------------------------------------------------------
 * This file handles API Modeling docs page related event handling methods, method to receive oAuth 2 access token and code mirror editor invocation methods.
 * Depends:
 *  jquery_1.7.2.min.js, bootstrap-tooltip.js, codemirror.js, codemirror_javascript.js, codemirror_xml.js, prism.js, base64_min.js.
 */
var apiModelCommon; // An Instance of a 'Apigee.APIModel.Common' class.
var apiModelMethods; // An Instance of a 'Apigee.APIModel.Methods' class.
var apiModelInlineEdit; // An Instance of a 'Apigee.APIModel.InlineEdit' class.
var apiModelEditor;
Apigee.APIModel.authUrl = "";
Apigee.APIModel.proxyURL; // Stores proxy URL.

$(function() {
    apiModelEditor = new Apigee.APIModel.Editor();
    apiModelCommon = new Apigee.APIModel.Common();
    if (localStorage.getItem("unsupportedBrowserFlag") == null) {
        apiModelCommon.showUnsupportedBrowserAlertMessage();
    }
    if (Apigee.APIModel.methodType == "index") { // Create an Instance of a 'Apigee.APIModel.Common' class and call the init method.
        Apigee.APIModel.initIndexEvents();
    } else {
        // Create an instance of 'Apigee.APIModel.Methods' and 'Apigee.APIModel.apiModelCommon' classes.
        apiModelMethods = new Apigee.APIModel.Methods();
        apiModelMethods.init();
        var editModeQueryParam = apiModelCommon.getQueryParam(location.href,"editMode");
        // Create an instance of 'Apigee.APIModel.InlineEdit' class, if there is a query param called 'editMode' with value =1 or 2 in the URL.
        if (editModeQueryParam == "1" || editModeQueryParam == "2") { // Invoke index class object if there is a query param called 'editMode' available in the URL.
          apiModelInlineEdit = new Apigee.APIModel.InlineEdit();
          apiModelInlineEdit.init(parseInt(editModeQueryParam))
        }
    }
});
/*
 * Define Apigee.APIModel.Index class events.
 * Apigee.APIModel.Index does not have any methods other than method name truncating and resource path truncating.
 */
Apigee.APIModel.initIndexEvents = function() {
    // If method name length is more than 20, show the first 17 charecters followed by ellipsis (...).
    $("a[data-role='method_name']").each(function() {
        apiModelCommon.shortenText($(this),20)
    });
    // If resource name length is more than 25, show the first 22 charecters followed by ellipsis (...).
    $("p[data-role='resource_path']").each(function() {
        apiModelCommon.shortenText($(this),25)
    });
    $('#index_content').show();
}
/*
 * Event handlers which are called more than once.
 */
Apigee.APIModel.initMethodsAuthDialogsEvents = function() {
    $("a.link_open_basicauth").unbind("click").click(function() {
        apiModelMethods.updateAuthModalFooter("basic_auth_modal");
    });
    $("a.link_open_oauth2").unbind("click").click(function() {
        apiModelMethods.updateAuthModalFooter("oauth2_modal");
    });
    $("a.link_open_customtoken").unbind("click").click(function() {
        apiModelMethods.getCustomTokenCredentials();
        $("[data-role='custom_token_modal']").modal('show');
    });
    $("a.link_open_passwordgrant").unbind("click").click(function () {
        apiModelMethods.updateAuthModalFooter("password_grant_modal");
    });
    $("[data-role='basic_auth_modal']").find(".button_close_modal").unbind("click").click(apiModelCommon.closeAuthModal);
    $("[data-role='basic_auth_modal']").find(".button_save_modal").unbind("click").click(apiModelMethods.saveAuthModal);
    $("[data-role='oauth2_modal']").find(".button_close_modal").unbind("click").click(apiModelCommon.closeAuthModal);
    $("[data-role='oauth2_modal']").find(".button_save_modal").unbind("click").click(apiModelMethods.saveAuthModal);
    $("[data-role='custom_token_modal']").find(".button_close_modal").unbind("click").click(apiModelCommon.closeAuthModal);
    $("[data-role='custom_token_modal']").find(".button_save_modal").unbind("click").click(apiModelMethods.saveAuthModal);
    $("[data-role='password_grant_modal']").find(".button_close_modal").unbind("click").click(apiModelCommon.closeAuthModal);
    $("[data-role='password_grant_modal']").find(".button_save_modal").unbind("click").click(apiModelMethods.saveAuthModal);
    $("[data-role='password_grant_modal']").find(".button_token_request_modal").unbind("click").click(apiModelMethods.handlePWG);
    $("[data-role='basic_auth_container'] .icon-remove").unbind("click").click("basicauth",apiModelMethods.clearSessionStorage);
    $("[data-role='oauth2_container'] .icon-remove").unbind("click").click("oauth2",apiModelMethods.clearSessionStorage);
    $("[data-role='custom_token_container'] .icon-remove").unbind("click").click("customtoken",apiModelMethods.clearSessionStorage);
    $("[data-role='password_grant_container'] .icon-remove").unbind("click").click("passwordgrant",apiModelMethods.clearSessionStorage);
    $(".authentication .well").unbind("click").click(apiModelMethods.toggleAuthScheme);
    $("#modal_container.modal input").keyup(function(e){
        $(this).removeClass("error");
        $(".modal .error_container").hide().html("");
    });
}
/*
 * Define Apigee.APIModel.Details class events.
 */
Apigee.APIModel.initMethodsPageEvents = function() {
    // Set the tooltip text position.
    $("span").tooltip({
        'selector': '',
        'placement': 'top'
    });
    // Template params related event handlers.
    $("[data-role='method_url_container'] span.template_param")
        .keyup(function(e){
            var rightArrow = (e.which == 39) ? true : false;
            $(this).removeClass("error");
            apiModelMethods.clearErrorContainer();
            apiModelMethods.updateTemplateParamText($(this));
            apiModelMethods.updateTemplateParamWidth($(this),rightArrow);
        })
        .keypress(function(e){
            var code = e.keyCode || e.which;
            var rightArrow = (code == 39) ? true : false;
            apiModelMethods.updateTemplateParamWidth($(this),rightArrow);
        })
        .blur(function(e){
            $(this).text($.trim($(this).text()));
        });
    $("[data-role='query-param-list'] input, [data-role='header-param-list'] input, [data-role='body-param-list'] input, [data-role='param-group-list'] input, [data-role='response_errors_list'] input, [data-role='attachments-list'] input").keyup(function(e){
        $(this).removeClass("error");
        apiModelMethods.clearErrorContainer();
    });
    // Send request related
    $("a.link_reset_default").unbind("click").click(apiModelMethods.resetFields);
    $("#send_request").unbind("click").click(apiModelMethods.sendRequest);
    $(".request_response_tabs a").unbind("click").click(apiModelMethods.swapSampleRequestResponseContainer);
    $("ul[data-role='request-payload-link'] a").unbind("click").click(apiModelMethods.toggleRequestPayload);
}
/*
 * Define Apigee.APIModel.DetailsEdit class events.
 */
Apigee.APIModel.initInlineEditAdminAuthEvents = function() {
    // Authentication related event handlers.
    // TODO: add password grant save auth modal either here or in apiModelInlineEdit.saveAuthModal
    $("[data-role='edit_auth_modal']").find(".button_save_modal").unbind("click").click(apiModelInlineEdit.saveAuthModal);
    $("[data-role='edit_auth_modal']").find(".button_close_modal").unbind("click").click(apiModelCommon.closeAuthModal);
    $("[data-role='confirm_modal']").find(".button_close_modal").unbind("click").click( function() {
      apiModelCommon.closeAuthModal();
      apiModelInlineEdit.resetEditableElement();
      return false;
    });
    $("[data-role='confirm_modal']").find(".button_save_modal").unbind("click").click(apiModelInlineEdit.handleConfirmDialogSave);
}
Apigee.APIModel.inlineEditPageEvents = function() {
    $(".icon-remove").click( function() {
      apiModelInlineEdit.clearAdminAuthDetails();
      location.reload()
    });
    $("a.auth_admin_email").click(apiModelInlineEdit.reOpenAdminAuthDetails);
    // Editable fields event handlers.
    $("[contenteditable='true'], [data-allow-edit='true']").unbind("hover").hover(apiModelInlineEdit.handleEditPropertiesMouseOver, apiModelInlineEdit.handleEditPropertiesMouseOut);
    // Show, Save, Cancel event handlers.
    $("[contenteditable='true'], [data-allow-edit='true'], .resource_description").unbind("click").click(apiModelInlineEdit.handleEditableElementsClick);
    $("a.allow_edit.ok").unbind("click").click(apiModelInlineEdit.makeAPICall);
    $("a.allow_edit.cancel").unbind("click").click(apiModelInlineEdit.resetEditableElement);
    // Document click handler,
    $(document).click(apiModelInlineEdit.documentClickHandler);

}
/**
 * Called after successful OAuth 2 dance.
 * Constructs JSON object and calls the 'Apigee.APIModel.Details' class setOAuth2Credentials method.
 */
setAccessTokenAndLocation = function(errorCode, errorMessage, accessToken, accessTokenType , accessToeknParamName, proxyURL) {
    var oauth2Credentials = {};
    oauth2Credentials.errorCode = errorCode;
    oauth2Credentials.errorMessage = errorMessage;
    oauth2Credentials.accessToken  = accessToken;
    oauth2Credentials.accessTokenType = accessTokenType;
    oauth2Credentials.accessToeknParamName = accessToeknParamName;
    oauth2Credentials.proxyURL = proxyURL;
    apiModelMethods.setOAuth2Credentials(oauth2Credentials);
}
