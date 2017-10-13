
/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
var utils = (function() {

    var __formatString = function(value, args) {     
        for (var i = 0; i < args.length; i++) {
            var regexp = new RegExp('\\{'+i+'\\}', 'gi');
            value = value.replace(regexp, args[i]);
        }
        return value;
    };

    var __parseString = function(strDesc) {
        var resultStr;
        if (strDesc.indexOf("`") != -1) {
          var firstIndex = strDesc.indexOf("\`") + 1;
          //console.log("1st index of ` ", firstIndex);
          var lastIndex = strDesc.lastIndexOf("\`");
          //console.log("last index of ` ", lastIndex);
          resultStr = strDesc.slice(firstIndex, lastIndex);
        } 
        //console.log("resultStr ", resultStr);
        return resultStr;  
    };

    var __replaceString = function(str, char1) {
        var resultStr = str;
        if (str.indexOf(char1) != -1) {
          resultStr = str.replace(char1, "_");
        }
        return resultStr;
    };

    var __getTitleAction = function(strAction) {
        var title;  
        if (strAction.indexOf("title=") !== -1) {
            var index = strAction.indexOf("title=") + 6;
            //console.log("index ", index);
            title = strAction.substring(index);
            var nextSpace = title.indexOf(" ");
            // get content of title
            if (nextSpace !== -1) {
                title = title.substring(0, nextSpace);
            }
            // check if contain quote
            if (title.indexOf("\"") !== -1 ||
                title.indexOf("'") !== -1) {
                //var quote = title.substring(0, 1);
                //var tmpString = title.substring(1);
                //console.log("tmpString ", tmpString);
                //var lastIndex = tmpString.indexOf(quote);
                //title = title.substring(0, lastIndex + 2);
            } else { 
                title = "'" + title + "'";
            }
        }
        //console.log("title=", title);
        return title;
    };
    
    var __getCallbackAction = function(strAction) {
        var callbackStr, index;
           
        if (strAction.indexOf("onclick=") !== -1) {
            index = strAction.indexOf("onclick=") + 8;
        } else if (strAction.indexOf("onkeypress=") !== -1) {
            index = strAction.indexOf("onkeypress=") + 11;
        }
        //console.log("index ", index);
        if (index) {
            callbackStr = strAction.substring(index);
            //console.log("callback ", callbackStr);
            var lastIndex = callbackStr.indexOf(")");
            var hasQuotes = callbackStr.substring(0, 1);
            if (hasQuotes.indexOf("\"") !== -1 ||
                hasQuotes.indexOf("'") !== -1) {
                callbackStr = callbackStr.substring(0, lastIndex + 2);
            } else {
                callbackStr = "\"" + callbackStr.substring(0, lastIndex + 1) + "\"";
            }
        }
        //console.log("callback=", callbackStr);
        return callbackStr;
    };
    
    var __getButtonName = function(strName) {
        var buttonName;
        if (strName.indexOf("<b>") !== -1) {
            var firstIndex = strName.indexOf("<b>") + 3;
            var lastIndex = strName.indexOf("</b>");
            buttonName = strName.substring(firstIndex, lastIndex);
        } else {
            //get string from last index of <action forward
            var tmpStr = strName.substring(7);
            if (tmpStr.indexOf(">") !== -1) {
                var firstIndex = tmpStr.indexOf(">") + 1;
                var lastIndex = tmpStr.indexOf("</action>");
                buttonName = tmpStr.substring(firstIndex, lastIndex);
            }
        }
        //console.log("buttonName=", buttonName);
        return buttonName;
    };

    var __parseActionTag = function(str) {
        var resultStr = str;                    
        var actionArray = str.match(/<action\b[^>]*>((\s|\S)*?)<\/action>/gm);
        //console.log("parseStr: ", actionArray);
        for (var a in actionArray) {
            var origActionStr = actionArray[a];
            //console.log("action[" + a + "]", origActionStr);
            var name =  __getTitleAction(origActionStr); 
            if (name) {          
                var callback = __getCallbackAction(origActionStr);
                var buttonName = __getButtonName(origActionStr);
                // construct new action
                var newActionStr = "<action role='button' tabindex='0' title=" + name + " aria-label=" + name + " onkeypress=" + callback + " onclick=" + callback + " ><b>" + buttonName + "</b></action>";
                //console.log("new action ", newActionStr);
                resultStr = resultStr.replace(origActionStr, newActionStr);
            }
        }
        //console.log("resultStr ", resultStr);
        return resultStr;  
    };

    return {
        formatString: __formatString,
        parseString: __parseString,
        replaceString: __replaceString,
        parseActionTag: __parseActionTag
    };

})();