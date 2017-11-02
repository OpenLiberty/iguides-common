
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
        str = str.replace(/^\s+/,"");    // Trim spaces on the left
        quote = str.substring(0, 1);
        //console.log("quote ", quote);
        return quote;
    }

    var __getAttributeAction = function(strAction, attr) {
        var str, resultStr;
        if (strAction.indexOf(attr) !== -1) {
            var index = strAction.indexOf(attr) + attr.length;
         
            str = strAction.substring(index);
            var quote = __getQuote(str);
            if (quote === "\"" || quote === "'") {            
                // exclude the first quote
                var openQuoteIndex = str.indexOf(quote);
                str = str.substring(openQuoteIndex + 1);
                var closeQuoteIndex = str.indexOf(quote);
                if (closeQuoteIndex !== -1) {
                    str = quote + str.substring(0, closeQuoteIndex + 1);
                } else {
                    console.error("syntax error: " + str + " in <action> tag missing closing quote");
                }
            } else {
                console.error("syntax error: " + str + " in <action> tag missing open quote");
            }
        }
     
        if (str) {
            var attrStr = attr + str;
            // remove the attr from action
            strAction = strAction.replace(attrStr, "");
        } 
        resultStr = {attr: str, action: strAction}; 
        
        return resultStr;   
    }

    var __getTitleAction = function(strAction) {
        var title = __getAttributeAction(strAction, "title=");
        //console.log("title=", title.attr);   
        return title;
    };
    
    var __getOnClickAction = function(strAction) {
        var str = __getAttributeAction(strAction, "onclick=");
        //console.log("onclick=", str.attr);
        return str; 
    }

    var __getOnKeyPressAction = function(strAction) {
        var str = __getAttributeAction(strAction, "onkeypress=");
        //console.log("onkeypress=", str.attr);
        return str;
    }

    var __getAriaLabelAction = function(strAction) {
        var str = __getAttributeAction(strAction, "aria-label=");
        //console.log("aria-label=", str.attr);
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
        for (var a in actionArray) {
            var origActionStr = actionArray[a];
            var tmpActionStr = origActionStr;
            //console.log("action[" + a + "]", origActionStr);
            var titleObj =  __getTitleAction(tmpActionStr); 
            var title = titleObj.attr; 
            if (title) {                
                tmpActionStr = titleObj.action;               
                var onclickMethodObj = __getOnClickAction(tmpActionStr);
                var onclickMethod = onclickMethodObj.attr;
                tmpActionStr = onclickMethodObj.action;
        
                var onkeypressMethodObj = __getOnKeyPressAction(tmpActionStr);
                var onkeypressMethod = onkeypressMethodObj.attr;
                tmpActionStr = onkeypressMethodObj.action;
              
                if (onclickMethod) {
                    if (!onkeypressMethod) {
                        onkeypressMethod = onclickMethod;
                    }
                } else if (onkeypressMethod) {
                    if (!onclickMethod) {
                        onclickMethod = onkeypressMethod;
                    }
                }

                var ariaLabelObj = __getAriaLabelAction(tmpActionStr);
                var ariaLabel = ariaLabelObj.attr;
                if (!ariaLabel) {
                    ariaLabel = title;
                }
                tmpActionStr = ariaLabelObj.action;
            
                var buttonName = __getButtonName(tmpActionStr);
                
                // construct new action
                var newActionStr = "<action role='button' tabindex='0' title=" + title + " aria-label=" + ariaLabel + " onkeypress=" + onkeypressMethod + " onclick=" + onclickMethod + " >" + buttonName + "</action>";
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