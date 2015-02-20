/** API CALL HANDLER */
var apiEngine;
var ApiBox = function() {
    var that = this;

    /**
        API caller.
        @param {object} callInfo - overriding call object.
    */
    this.doCall = function(callInfo) {
        /** Base call payload object; typically overridden by callInfo.settings. */
        var callPayload = {
            dataType : "json",
            headers : {
                accept : "application/json",
                contentType : "text/plain"
            },
            success : function(data, textStatus, jqXHR) {},
            error : function(jqXHR, textStatus, errorThrown) {},
            complete : function(jqXHR, textStatus) {}
        };

        /** If callInfo has a "settings" property, override callPayload data with the property value data. */
        if (callInfo.hasOwnProperty("settings")) $.extend(true, callPayload, callInfo.settings);

        /** Make the API ajax call. */
        $.ajax(callInfo.url, callPayload);
    };

    var init = function() {

    }();

}

/** STORAGE HANDLER */
var storageEngine;
var StorageBox = function() {
    var that = this;

    /**
        If a given item exists in localStorage, parse it into an object and return it.
        @param {string} itemName - the name of the item.
        @returns {object} itemObject - the parsed object.
    */
    this.memoryToObject = function(itemName) {
        var itemObject;
        try {
            itemObject = JSON.parse(localStorage.getItem(itemName));
        } catch (e) {
            itemObject = false;
        }
        return itemObject;
    };

    /**
        Takes an object and saves it to localStorage.
        @param {string} objectName - name to use as a storage key.
        @param {object} theObject - the object passed in.
        @returns {string} theString - the stringified version of the object.
    */
    this.objectToMemory = function(objectName, theObject) {
        var theString;
        try {
            theString = JSON.stringify(theObject);
            localStorage.setItem(objectName, theString);
        } catch (e) {
            theString = false;
        }
        return theString;
    }

    var init = function() {

    }();
}

/** URL HANDLER */
var urlEngine;
var UrlBox = function() {
    var that = this;

    /**
        Set the working URL.
        @param {string} theUrl - the URL to work with.
    */
    this.setUrl = function(theUrl) {
        that.workingUrl = theUrl;
    };

    /**
        Get all parameters from a URL, and return them as an object.
        If a URL is not supplied, use the UrlBox instance's working URL.
        @param {string} [theUrl=workingUrl] - the URL to work with.
        @returns {object} paramObject - the URL parameters.
    */
    this.getParams = function(theUrl) {
        var theUrl = theUrl || that.workingUrl;
        var paramObject = {};
        var urlArray = theUrl.split("?");
        var urlPath = urlArray.shift();
        var urlParams = (urlArray.length > 0) ? urlArray.join("?").split("&") : [];
        forEach(urlParams, function(thisPair) {
            var pairArray = thisPair.split("=");
            var pairKey = pairArray.shift();
            var pairVal = (pairArray.length > 0) ? pairArray.join("=") : null;
            paramObject[pairKey] = pairVal;
        });
        return paramObject;
    };

    /**
        Add params to a URL and return it.
        @param {object} newParams - the parameters/values to add.
        @param {string} theUrl - the URL to work with.
        @returns {string} - the URL with new params.
    */
    this.setParams = function(newParams, theUrl) {
        var theUrl = theUrl || that.workingUrl;
        var oldParams = that.getParams(theUrl);
        forEach(oldParams, function(paramValue, paramKey) {
            if (!newParams.hasOwnProperty(paramKey)) newParams[paramKey] = paramValue;
        });
        theUrl = theUrl.split("?")[0] + "?";
        var paramArray = [];
        forEach(newParams, function(paramValue, paramKey) {
            paramArray.push(paramKey+"="+paramValue);
        });
        return theUrl + paramArray.join("&");
    };

    /**
        Return the value of a given URL param.
        @param {string} paramKey - the parameter key.
        @param {string} theUrl - the URL to work with.
        @returns {string} paramVal - the value of the URL parameter.
    */
    this.getParam = function(paramKey, theUrl) {
        var theUrl = theUrl || that.workingUrl;
        var allParams = that.getParams(theUrl);
        var paramVal = (allParams.hasOwnProperty(paramKey)) ? allParams[paramKey] : false;
        return paramVal;
    };

    /**
        Create/Set the value of a given URL param.
        @param {string} paramKey - the parameter key.
        @param {string} paramValue - the parameter value.
        @param {string} theUrl - the URL to work with.
        @returns {string} - the URL with the new parameter set.
    */
    this.setParam = function(paramKey, paramValue, theUrl) {
        var theUrl = theUrl || that.workingUrl;
        var allParams = that.getParams(theUrl);
        allParams[paramKey] = paramValue;
        return that.setParams(allParams, theUrl);
    }

    /**
        Clear a given URL param.
        @param {string} paramKey - the parameter key.
        @param {string} theUrl - the URL to work with.
        @returns {string} - the URL with the parameter removed.
    */
    this.clearParam = function(paramKey, theUrl) {
        var theUrl = theUrl || that.workingUrl;
        var allParams = that.getParams(theUrl);
        if (allParams.hasOwnProperty(paramKey)) delete allParams[paramKey];
        return that.setParams(allParams, theUrl.split("?")[0]);
    }

    var init = function() {

        /** Set this instance's working URL to be the document location. */
        that.setUrl(document.location.href);

    }();
}

$(function() {
    /** INSTANTIATE HELPER OBJECTS */
    apiEngine = new ApiBox();
    storageEngine = new StorageBox();
    urlEngine = new UrlBox();
});


/** GENERAL UTILITIES */

/**
    Iterate through an object, performing the specified function on each property.
    @param {object} theObject - the object to iterate through.
    @param {object} theFunction - the function to execute on each property.
*/
var forEach = function(theObject, theFunction) {
    for (var theKey in theObject) {
        if (theObject.hasOwnProperty(theKey)) theFunction(theObject[theKey], theKey);
    }
};

/**
    Wraps the given text with the given tag.
    @param {string} theText - The text to wrap.
    @param {string} theTag - The tag name to wrap around the text.
    @param {object} tagAttributes - Optional attributes (like class, id, etc.) to be added to the tag.  Multiple values should be sent as an array.
    @returns {string} theText - formatted message.
    @see forceArray.
*/
var wrapWithTag = function(theText, theTag, tagAttributes) {
    var theText = theText || '';
    var theTag = (theTag) ? $.trim(theTag).toLowerCase() : false;
    var tagAttributes = tagAttributes || false;
    var attributesString = '';
    if (tagAttributes) {
        var attributesArray = [];
        forEach(tagAttributes, function(attributeValue, attributeKey) {
            attributesArray.push(attributeKey+'="'+forceArray(attributeValue).join(" ")+'"');
        });
        attributesString = ' '+attributesArray.join(" ");
    }
    if (theTag) {
        theText = (theText !== "") ? '<'+theTag+attributesString+'>'+theText+'</'+theTag+'>' : '<'+theTag+attributesString+' />';
    }
    return theText;
}

/**
    Make a pretty string out of a raw JSON string.
    @param {string} rawJson - the raw JSON string.
    @returns {string} prettyJson - the pretty JSON string.
*/
var cleanJson = function(rawJson) {
    var jsonObject;
    try {
        jsonObject = JSON.parse(rawJson);
    } catch (e) {
        jsonObject = false;
    }
    prettyJson = (jsonObject) ? JSON.stringify(jsonObject, null, '\t') : rawJson;
    return prettyJson;
}


/**
    Base64 encrypt a username and password, and return the value.
    @param {string} username - user name.
    @param {string} password - password.
    @returns {string} - the Base64 encrypted value.
*/
var generateAuth = function(username, password) {
    return $().crypt({method:"b64enc",source:username+':'+password});
};

/**
    Force a supplied item to be an array, if it is not already one.
    @param {string|array|object} rawItem - the raw item.
    @returns {array} - the forced array.
*/
var forceArray = function(rawItem) {
    return ($.isArray(rawItem)) ? rawItem : [rawItem];
}