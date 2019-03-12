
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

    /**
     * 
     * @param {String} value - String with value {0} to replace
     * @param {Array} args - an array containing strings to replace {i}
     */
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
    };

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
    };

    var __getTitleAction = function(strAction) {
        var title = __getAttributeAction(strAction, "title=");
        //console.log("title=", title.attr);   
        return title;
    };
    
    var __getOnClickAction = function(strAction) {
        var str = __getAttributeAction(strAction, "onclick=");
        //console.log("onclick=", str.attr);
        return str; 
    };

    var __getOnKeyPressAction = function(strAction) {
        var str = __getAttributeAction(strAction, "onkeypress=");
        //console.log("onkeypress=", str.attr);
        return str;
    };

    var __getAriaLabelAction = function(strAction) {
        var str = __getAttributeAction(strAction, "aria-label=");
        //console.log("aria-label=", str.attr);
        return str;
    };
    
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

    var isElementActivated = function(event) {
        if (event.type === "click" ||
           (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
            // Click or 'Enter' or 'Space' key event...
            return true;
        } else {
            return false;
        }
    };

    var isInteger = function(value) {
        var testRE = /^[0-9]+$/;
        return (testRE.test(value));
    };

    var handleEditorSave = function(stepName, editor, isUpdateSuccess, correctErrorBlock, lineNumToScroll, fileName) {
        editor.closeEditorErrorBox();
        if (isUpdateSuccess) {
            if (contentManager.getCurrentInstructionIndex(stepName) === 0) {
                contentManager.markCurrentInstructionComplete(stepName);
                editor.addCodeUpdated();          
                // Put the browser into focus if it is enabled
                var stepBrowser = contentManager.getBrowser(stepName);
                if (stepBrowser) {
                    var stepWidgetContainer = $('.stepWidgetContainer[data-step="' + stepName + '"]');
                    if (stepWidgetContainer.length > 0) {
                        var browserContainer = stepWidgetContainer.find('#' + stepName + '-webBrowser-0');
                        if (browserContainer.length > 0) {
                            if (!browserContainer.hasClass('disableContainer')) {
                                stepBrowser.contentRootElement.trigger("click");
                            }
                        }
                    }
                }
                if (lineNumToScroll) {
                    contentManager.scrollTabbedEditorToView(stepName, fileName, lineNumToScroll);
                }
            }
        } else {
            if (contentManager.getCurrentInstructionIndex(stepName) === 0) {
                // display error
                editor.createErrorLinkForCallBack(true, correctErrorBlock);
            } else {
                editor.resetEditorContent();
                editor.createResetScenarioMessage();
            }
        }
    };

    var validateContentAndSave = function(stepName, editor, content, validateContentBlock, correctErrorBlock) {
        var updateSuccess = false;
        if (validateContentBlock(content)) {
            updateSuccess = true;
        }
        utils.handleEditorSave(stepName, editor, updateSuccess, correctErrorBlock);

        return updateSuccess;
    };

    /**
     * Count the physical number of lines that the content passed takes up in the editor.
     * @param String content String of the line(s) of code from the editor. This utility
     *                       will count the number of physical lines in the string by 
     *                       counting lineFeeds.
     * 
     * @return int  Number of lines in the content.
     */
    var countLinesOfContent = function(content) {
        var lines = content.match(/\r*\n/g);
        return lines !== null ? lines.length : 0;
    };

    /**
     * Save the feature added to the Server.xml file as currently shown in the 
     * editor content.  This includes marking the correct lines for writable and
     * read-only.
     * 
     * @param {*} editor - editor object
     * @param {String} content - tabbed editor contents associated with this editor
     * @param {String} featureString - Simple string of the feature that was added
     */
     var saveFeatureInContent = function(editor, content, featureString) {
        // Escape any periods (.) within the featureString
        featureString = featureString.replace(/\./g, '\\.');

        var editableContent = "[\\s\\S]*<feature>\\s*" + featureString + "\\s*<\\/feature>";
        saveContentInEditor(editor, content, editableContent);
    };

    /**
     * Save the contents in the Editor object.  This includes marking the editable
     * (writable) text lines with the appropriate marker and making the rest 
     * of the line read-only.
     * 
     * LIMITATION: This only marks one set of editable content.
     * 
     * @param {*} editor - editor object
     * @param {String} content - tabbed editor contents associated with this editor
     * @param {Regex string} editableContent - regex to encapsuate the editable
     *                              line(s) within the content. For example, the
     *                              annotation, method, feature line, etc.
     */
    var saveContentInEditor = function(editor, content, editableContent) {
        try {
            // Save the new content for this editor.  Determine which lines
            // should be marked editable and which should be read-only.
            //
            // Use capture groups to get content before the editable content,
            // the editable content, and content after the editable part. 
            // Then we can count the lines of code in each group in order 
            // to correctly update the saved writable and read-only lines.
            //
            // Result:
            //   groups[0] - same as content
            //   groups[1] - content before the writable lines
            //   groups[2] - the editable (writable) lines
            //   groups[3] - content after the writable lines
            var codeToMatch = "([\\s\\S]*)" +
                            "(" + editableContent + ")" +
                            "([\\s\\S]*)";
            var regExpToMatch = new RegExp(codeToMatch, "g");
            var groups = regExpToMatch.exec(content);

            var start = groups[1];
            var startLines = utils.countLinesOfContent(start);
            var editable = groups[2];   // Group containing just the editable content
            var editableLines = utils.countLinesOfContent(editable) + 1;
            var end = groups[3];
            var endLines = utils.countLinesOfContent(end);

            var markText = [{from: 1, to: startLines}, 
                            {from: startLines + editableLines + 1, to: startLines + editableLines + endLines}];
            var markTextWritable = [{from: startLines + 1, to: startLines + editableLines}];
            editor.updateSavedContent(content, markText, markTextWritable);
        } catch (e) {

        }
    };


    return {
        formatString: __formatString,
        parseString: __parseString,
        replaceString: __replaceString,
        parseActionTag: __parseActionTag,
        isElementActivated: isElementActivated,
        isInteger: isInteger,
        handleEditorSave: handleEditorSave,
        validateContentAndSave: validateContentAndSave,
        countLinesOfContent: countLinesOfContent,
        saveFeatureInContent: saveFeatureInContent,
        saveContentInEditor: saveContentInEditor
    };

})();