
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

    var __getQuote = function(str) {
        var quote;
        str = str.trimLeft();
        quote = str.substring(0, 1);
        //console.log("quote ", quote);
        return quote;
    }

    var __getAttributeAction = function(strAction, attr) {
        var str;  
        if (strAction.indexOf(attr) !== -1) {
            var index = strAction.indexOf(attr) + attr.length;
            //console.log("index ", index);
            str = strAction.substring(index);
            var quote = __getQuote(str);
            if (quote) {             
                // exclude the first quote
                var openQuoteIndex = str.indexOf(quote);
                str = str.substring(openQuoteIndex + 1);
                var closeQuoteIndex = str.indexOf(quote);
                if (closeQuoteIndex !== -1) {
                    str = quote + str.substring(0, closeQuoteIndex + 1);
                } else {
                    console.log("syntax error: " + str + " in <action> tag missing closing quote");
                }
            } else {
                console.log("syntax error: " + str + " in <action> tag missing open quote");
            }
        }
        //console.log(attr + ": ", str);
        return str;   
    }

    var __getTitleAction = function(strAction) {
        var title = __getAttributeAction(strAction, "title=");
        //console.log("title=", title);
        return title;
    };
    
    var __getOnClickAction = function(strAction) {
        var str = __getAttributeAction(strAction, "onclick=");
        //console.log("onclick=", str);
        return str; 
    }

    var __getOnKeyPressAction = function(strAction) {
        var str = __getAttributeAction(strAction, "onkeypress=");
        //console.log("onkeypress=", str);
        return str;
    }
    
    var __getButtonName = function(strName) {
        var buttonName;
        //get string from last index of <action forward
        var tmpStr = strName.substring(7);
        if (tmpStr.indexOf(">") !== -1) {
            var firstIndex = tmpStr.indexOf(">") + 1;
            var lastIndex = tmpStr.indexOf("</action>");
            buttonName = tmpStr.substring(firstIndex, lastIndex);
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
            var title =  __getTitleAction(origActionStr, "title="); 
            if (title) {          
                var onclickMethod = __getOnClickAction(origActionStr, "onclick=");
                var onkeypressMethod = __getOnKeyPressAction(origActionStr, "onkeypress=");
                if (onclickMethod) {
                    if (!onkeypressMethod) {
                        onkeypressMethod = onclickMethod;
                    }
                } else if (onkeypressMethod) {
                    if (!onclickMethod) {
                        onclickMethod = onkeypressMethod;
                    }
                }
                var buttonName = __getButtonName(origActionStr);
                // construct new action
                var newActionStr = "<action role='button' tabindex='0' title=" + title + " aria-label=" + title + " onkeypress=" + onkeypressMethod + " onclick=" + onclickMethod + " >" + buttonName + "</action>";
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