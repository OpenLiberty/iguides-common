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
var editor = (function() {
    var __editors = {}; // ToDo: __editors is no longer needed with the new changes

    var editorType = function(container, stepName, content) {
        var deferred = new $.Deferred();
        this.stepName = stepName;
        this.saveListenerCallback = null;
        this.fileName = "";
        __loadAndCreate(this, container, stepName, content).done(function(result){
            deferred.resolve(result);
        });
        return deferred;
    };

    editorType.prototype = {
        getEditor: function() {
            return this.editor;
        },
        getEditorContent: function() {
            return this.editor.getValue();
        },
        setEditorContent: function(value) {
            this.editor.setValue(value);
        },
        resetEditorContent: function() {
            __handleResetClick(this);
        },
        // insert content before the specified line number
        insertContent: function(lineNumber, content, numberOfLines) {
            var markTextToLineNumber = lineNumber - 1;
            if (numberOfLines !== undefined) {
                markTextToLineNumber = lineNumber - 2 + numberOfLines;
            }
            if(lineNumber > 1){
                content = '\n' + content;
            }
            this.editor.replaceRange(content, {line: lineNumber-2});
            this.editor.markText({line: lineNumber-2}, {line: markTextToLineNumber}, {className: "insertTextColor", readOnly: false})
            if (numberOfLines !== undefined) {
                var i;
                for (i = 0; i < numberOfLines; i++) {
                    this.editor.addLineClass((lineNumber + i) - 1, 'gutter', 'insertBorderLine');
                } 
            } else {
                this.editor.addLineClass(lineNumber - 1, 'gutter', 'insertBorderLine');   
            }      
        },
        // append content after the specified line number
        appendContent: function(lineNumber, content, numberOfLines) {
            var markTextToLineNumber = lineNumber;
            if (numberOfLines !== undefined) {
                markTextToLineNumber = lineNumber - 1 + numberOfLines;
            }
            if(lineNumber > 1){
                content = '\n' + content;
            }
            this.editor.replaceRange(content, {line: lineNumber-1});
            this.editor.markText({line: lineNumber-1}, {line: markTextToLineNumber}, {className: "insertTextColor", readOnly: false})
            
            if (numberOfLines !== undefined) {
                var i;
                for (i = 0; i < numberOfLines; i++) {
                    this.editor.addLineClass((lineNumber + i), 'gutter', 'insertBorderLine');
                } 
            } else {
                this.editor.addLineClass(lineNumber, 'gutter', 'insertBorderLine');   
            }      
        },
        // replace content from and to the specified line number
        replaceContent: function(fromLineNumber, toLineNumber, content, numberOfLines) {
            var markTextToLineNumber = fromLineNumber - 1 + (toLineNumber - fromLineNumber );
            if(fromLineNumber > 1){
                content = '\n' + content;
            }
            this.editor.replaceRange(content, {line: fromLineNumber-2}, {line: toLineNumber-1});
            if (numberOfLines !== undefined) {
                markTextToLineNumber = fromLineNumber - 2 + numberOfLines;
            }
            this.editor.markText({line: fromLineNumber-2}, {line: markTextToLineNumber}, {className: "insertTextColor", readOnly: false})
            
            if (numberOfLines === undefined) {
                numberOfLines = (toLineNumber - fromLineNumber) + 1;
            }
            var i;
            for (i = 0; i < numberOfLines; i++) {
                this.editor.addLineClass((fromLineNumber + i) - 1, 'gutter', 'insertBorderLine');
            } 
        },
        addSaveListener: function(callback) {
            //console.log("saveListener callback", callback);
            this.saveListenerCallback = callback;
        },
        addContentChangeListener: function(callback) {
            var thisEditor = this;
            this.editor.on("change", function(instance, change) {
                if (!thisEditor.contentChanges) {
                    thisEditor.contentChanges = [];
                }
                thisEditor.contentChanges.push(change);
                if (thisEditor.contentChangeTimeout) {
                    clearTimeout(thisEditor.contentChangeTimeout);
                    thisEditor.ccontentChangeTimeout = undefined;
                }
                thisEditor.contentChangeTimeout = setTimeout(function() {
                     // Wait until timeout to call callback so as to reduce the number of calls when
                     // content is still changing.
                     // Pass to callback all the saved changes from the editor change event.
                     callback(thisEditor.editor, thisEditor.contentChanges);
                     thisEditor.contentChangeTimeout = undefined;
                     thisEditor.contentChanges = [];
                }, 1000);
            });
        },
        getStepName: function() {
            return this.stepName;
        },
        getFileName: function() {
            return this.fileName;
        },
        saveEditor: function() {
            __handleSaveClick(this);
        },
        markTextForReadOnly: function(readonlyLines) {
            if ($.isArray(readonlyLines)) {
                __markTextForReadOnly(this, __adjustReadOnlyLines(readonlyLines));
            }
        },
        markEditorReadOnly: function() {
            __markEditorReadOnly(this);
        },
        closeEditorErrorBox: function() {
            if (this.alertFrame.length) {
                this.alertFrame.addClass("hidden");
                // recalculate the height when alert pane is closed
                this.codeEditor.css("height", 'calc(100% - 34px)');
            }
        },
        createErrorLinkForCallBack: function(isSave, correctErrorCallback) {
            var errorMsg = "Error detected. To fix the error click ";
            __createErrorAlertPane(this, 'alert-danger', isSave, true, errorMsg, correctErrorCallback);
        },
        createCopyButtonError: function(){
            var errorMsg = messages.editorErrorCopying;
            __createErrorAlertPane(this, 'alert-danger', false, true, errorMsg);
        },
        createReadonlyAlert: function(){
            var errorMsg = messages.editorReadonlyAlert;
            __createErrorAlertPane(this, 'alert-warning', false, false, errorMsg);
        },
        createCustomErrorMessage: function(errorMsg){
            __createErrorAlertPane(this, 'alert-danger', false, true, errorMsg);
        },
        createCustomAlertMessage: function(alertMsg) {
            __createErrorAlertPane(this, 'alert-warning', false, true, alertMsg);
        }
    };

    var __loadAndCreate = function(thisEditor, container, stepName, content) {
            //console.log("using ajax to load editor.html", container);
            var deferred = new $.Deferred();
            $.ajax({
                context: thisEditor,
                url: "/guides/iguides-common/html/interactive-guides/editor.html",
                async: true,
                cache: true,
                success: function (result) {
                    container.append($(result));
                    
                    if (content.fileName) {
                        container.find('.editorContainer').attr("aria-label", content.fileName + " editor");
                        container.find('.editorFileName').text(content.fileName);
                        thisEditor.fileName = content.fileName;              
                        //$(".editorContainer").css("margin-top", "-20px");
                        //container.find(".editorContainer").css({
                        //    "margin-top": "-20px",
                        //    "margin-bottom": "50px"
                        //});
                        if (content.editorHeight !== undefined) {             
                            container.find(".editorContainer").css({
                                "height": content.editorHeight
                            });
                        }
                    }
                    var editor = container.find('.codeeditor');
                    var id = container[0].id + "-codeeditor";
                    editor.attr("id", id);
                    __createEditor(thisEditor, id, container, stepName, content);
                    deferred.resolve(thisEditor);
                },
                error: function (result) {
                    //console.error("Could not load the edittor.html");
                    deferred.resolve(thisEditor);
                }
            });
            return deferred;
    };

    var __createEditor = function(thisEditor, id, container, stepName, content) {
        var isReadOnly = false;
        var markText = [];
        var markTextWritable = [];
        if (content.readonly === true || content.readonly === "true") {
            isReadOnly = true;
        } else if ($.isArray(content.readonly)) {
           markText = __adjustReadOnlyLines(content.readonly);
        }
        
        if (content.writable) {
            markTextWritable = __adjustWritableLines(content.writable);
        }
        
        thisEditor.editor = CodeMirror(document.getElementById(id), {
            lineNumbers: true,
            autoRefresh: true,
            theme: 'elegant',
            readOnly: isReadOnly,
            inputStyle: 'contenteditable',  // for input reader in accessibility
            extraKeys: {Tab: false, "Shift-Tab": false} // disable tab and shift-tab to indent or unindent inside the
                                                        // editor, instead allow accessibility for tab and shift-tab to
                                                        // advance to the next and previous tabbable element.
        });

        if (content.preload) {
            var preloadEditorContent = content.preload;
            if ($.isArray(content.preload)) {
                preloadEditorContent = content.preload.join("\n");
            }
            //console.log("formatted preloadEditorContent", preloadEditorContent);
            thisEditor.editor.setValue(preloadEditorContent);
            thisEditor.editor.contentValue = preloadEditorContent;
        }
        if (content.callback) {
            var callback = eval(content.callback);
            callback(thisEditor);
        }

        thisEditor.editorButtonFrame = container.find(".editorButtonFrame");
        var saveButton = container.find(".editorSaveButton");
        saveButton.attr('title', messages.saveButton);
        var resetButton = container.find(".editorResetButton");
        resetButton.attr('title', messages.resetButton);
        var copyButton = container.find('.editorCopyButton');
        copyButton.attr('title', messages.copyButton);
        var undoButton = container.find(".editorUndoButton");
        undoButton.attr('title', messages.undoButton);
        var redoButton = container.find(".editorRedoButton");
        redoButton.attr('title', messages.redoButton);
        var runButton = container.find(".editorRunButton");
        runButton.attr('title', messages.runButton);

        thisEditor.alertFrame = container.find(".alertFrame");

        thisEditor.codeEditor = container.find(".codeeditor");

        if ((content.save === false || content.save === "false")) {
            saveButton.addClass("hidden");
        } else if ((content.save === true || content.save === "true")) {
            runButton.addClass("hidden");
        }

        // mark any readOnly lines
        if (isReadOnly) {
            __markEditorReadOnly(thisEditor);
            thisEditor.createReadonlyAlert();
        } else {
            thisEditor.markText = markText;
            thisEditor.markTextWritable = markTextWritable;
            __markTextForWritable(thisEditor, thisEditor.markTextWritable);
            __markTextForReadOnly(thisEditor, thisEditor.markText);           
            __addSaveOnClickListener(thisEditor, saveButton);
            __addResetOnClickListener(thisEditor, resetButton);
            __addCopyOnClickListener(thisEditor, copyButton);
            __addUndoOnClickListener(thisEditor, undoButton);
            __addRedoOnClickListener(thisEditor, redoButton);
            __addSaveOnClickListener(thisEditor, runButton);
        }

        __editors[stepName] = thisEditor.editor;
    };

    var __adjustReadOnlyLines = function(readonlyLinesArray) {
        var markText = [];
        $.each(readonlyLinesArray, function(index, readonlyLines) {
            var fromLine;
            var toLine;

            if ($.isNumeric(readonlyLines.from)) {
                fromLine = parseInt(readonlyLines.from) - 2;
            } else {
                //console.log("invalid from line", readonlyLines.from);
            }
            if ($.isNumeric(readonlyLines.to)) {
                toLine = parseInt(readonlyLines.to) - 1;
            } else {
                //console.log("invalid to line", readonlyLines.to);
            }
            if (fromLine !== undefined && toLine !== undefined) {
                markText.push({
                    from: fromLine,
                    to: toLine
                });
            }
        });
        return markText;
    }

    var __adjustWritableLines = function(writableLinesArray) {
        var markText = [];
        $.each(writableLinesArray, function(index, writableLines) {
            var writableLine;

            if ($.isNumeric(writableLines.line)) {
                writableLine = parseInt(writableLines.line) - 1;
            } else {
                //console.log("invalid from line", writableLines.from);
            }
            
            if (writableLine !== undefined) {
                markText.push({line: writableLine});
            }
        });
        return markText;
    }
    
    var __markTextForWritable = function(thisEditor, markTextWritable) {
        $.each(markTextWritable, function(index, writableLine) {
            thisEditor.editor.addLineClass(writableLine.line, 'gutter', 'insertBorderLine');
        });
    }; 

    var __markTextForReadOnly = function(thisEditor, markText) {
         $.each(markText, function(index, readOnlyFromAndTo) {
             thisEditor.editor.markText({line: readOnlyFromAndTo.from}, {line: readOnlyFromAndTo.to}, {readOnly: true, className: "readonlyLines"});
         });
    };

    var __markEditorReadOnly = function(thisEditor) {
        thisEditor.markText = [];
        thisEditor.markText.push({
            from: -1,
            to: thisEditor.editor.lineCount() - 1
        });
        // apply the css for readonly lines
        __markTextForReadOnly(thisEditor, thisEditor.markText);
        __disableAllButtons(thisEditor, true);
    };

    var __createEditorErrorButton = function(buttonId, buttonName, className, method, ariaLabel) {
        return $('<button/>', {
            type: 'button',
            text: buttonName,
            id: buttonId,
            class: className,
            click: method,
            'aria-label': ariaLabel
        });
    };

    /*
     *   Create the error message pane for an invalid entry in the editor.
     *   @param alertClass: Bootstrap class for what the alert pane's class should be. It can be alert-success(green), alert-info(blue), alert-warning(yellow), or alert-danger(red).
     *   @param isSave: true/false if the editor needs to be saved after correcting it
     *   @param allowClose: true/false to specify if the user can dismiss the alert pane
     *   @param errorMsg: Message to display in the alert pane
     *   @param correctErrorCallback: Callback function to run once they click the 'here' fix it button.
    */
    var __createErrorAlertPane = function (thisEditor, alertClass, isSave, allowClose, errorMsg, correctErrorCallback) {
        var idHere = "here_button_error_editor_" + thisEditor.stepName;
        var idClose = "close_button_error_editor_" + thisEditor.stepName;
        var idError = "error_" + thisEditor.stepName + "_" + thisEditor.fileName; //added filenName to id to avoid duplicate ids
       
        var codeEditor = thisEditor.codeEditor;
        // when alert pane is show, recalculate the editor height 100% - 68px (editor button frame height + alert frame height)
        codeEditor.css("height", 'calc(100% - 68px)');
        
        // With the tabbedEditor, use the cached alertFrame.
        var editorError = thisEditor.alertFrame;
        if (editorError.length) {
            editorError.removeClass("hidden");
            editorError.empty(); // Clear previous errors in the error pane
        }
        editorError.attr('tabindex', '0');

        // Change the class of the alertFrame to the correct bootstrap class passed in as alertClass. This allows the alert to be yellow for warnings and red for error messages.
        editorError.removeClass('alert-success alert-info alert-warning alert-danger');
        editorError.addClass(alertClass);

        var spanStr = '<span id=\"' + idError + '\">' + errorMsg;
        editorError.append(spanStr);
        if (correctErrorCallback) {
            var handleOnClickFixContent = function () {
                __correctEditorError(thisEditor, isSave, correctErrorCallback);
                // close the alert frame so that each step doesn't have to call the close
                thisEditor.closeEditorErrorBox();
            };
            var hereButton = __createEditorErrorButton(idHere, messages.hereButton, "here_button_error_editor", handleOnClickFixContent, "Here");
            editorError.append(hereButton);
        }
        if(allowClose){
            var handleOnClickClose = function (event) {
                event.preventDefault();
                event.stopPropagation();
                thisEditor.closeEditorErrorBox();
                editorError.attr('tabindex', '-1');
            };
            var bkgcolor = "";
            if (alertClass === 'alert-warning') {
                bkgcolor = "close_button_warning_editor";
            } 
            var closeButton = __createEditorErrorButton(idClose, "", "glyphicon glyphicon-remove-circle close_button_error_editor " + bkgcolor, handleOnClickClose, "Close error");
            editorError.append(closeButton);
        }
        editorError.append('</span>');
    };

    var __correctEditorError = function(thisEditor, isSave, correctErrorCallback) {
        correctErrorCallback(thisEditor.stepName);
        // hide the error box
        thisEditor.closeEditorErrorBox();
        // call save editor
        if (isSave === true) {
            thisEditor.saveEditor();
        }
    };

    var __disableAllButtons = function(thisEditor, toDisabled) {
        if (toDisabled) {
            thisEditor.editorButtonFrame.find(".editorSaveButton").prop("disabled", true);
            thisEditor.editorButtonFrame.find(".editorRunButton").prop("disabled", true);
            thisEditor.editorButtonFrame.find(".editorRedoButton").prop("disabled", true);
            thisEditor.editorButtonFrame.find(".editorUndoButton").prop("disabled", true);
            thisEditor.editorButtonFrame.find(".editorResetButton").prop("disabled", true);
            thisEditor.editorButtonFrame.find(".editorCopyButton").prop("disabled", true);
        } else {
            thisEditor.editorButtonFrame.find(".editorSaveButton").prop("disabled", false);
            thisEditor.editorButtonFrame.find(".editorRunButton").prop("disabled", false);
            thisEditor.editorButtonFrame.find(".editorRedoButton").prop("disabled", false);
            thisEditor.editorButtonFrame.find(".editorUndoButton").prop("disabled", false);
            thisEditor.editorButtonFrame.find(".editorResetButton").prop("disabled", false);
            thisEditor.editorButtonFrame.find(".editorCopyButton").prop("disabled", false);
        }
    };

    var __addSaveOnClickListener = function(thisEditor, $elem) {
        $elem.on("keydown", function (event) {
            event.stopPropagation();
            if (event.which === 13 || event.which === 32) { // Enter key, Space key
                __handleSaveClick(thisEditor, $elem);
            }
        });
        $elem.on("click", function (event) {
            event.stopPropagation();
            __handleSaveClick(thisEditor, $elem);
        });
    };

    var __addResetOnClickListener = function(thisEditor, $elem) {
        $elem.on("keydown", function (event) {
            event.stopPropagation();
            if (event.which === 13 || event.which === 32) { // Enter key, Space key
                __handleResetClick(thisEditor, $elem);
            }
        });
        $elem.on("click", function (event) {
            event.stopPropagation();
            __handleResetClick(thisEditor, $elem);
        });
    };

    var __addCopyOnClickListener = function(thisEditor, $elem){
        $elem.on("keydown", function (event) {
            event.stopPropagation();
            if (event.which === 13 || event.which === 32) { // Enter key, Space key
                __handleCopyClick(thisEditor, $elem);
            }
        });
        $elem.on("click", function (event) {
            event.stopPropagation();
            __handleCopyClick(thisEditor, $elem);
        });
    };

    var __addUndoOnClickListener = function(thisEditor, $elem) {
        $elem.on("keydown", function (event) {
            event.stopPropagation();
            if (event.which === 13 || event.which === 32) { // Enter key, Space key
                __handleUndoClick(thisEditor, $elem);
            }
        });
        $elem.on("click", function (event) {
            event.stopPropagation();
            __handleUndoClick(thisEditor, $elem);
        });
    };

    var __addRedoOnClickListener = function(thisEditor, $elem) {
        $elem.on("keydown", function (event) {
            event.stopPropagation();
            if (event.which === 13 || event.which === 32) { // Enter key, Space key
                __handleRedoClick(thisEditor, $elem);
            }
        });
        $elem.on("click", function (event) {
            event.stopPropagation();
            __handleRedoClick(thisEditor, $elem);
        });
    };

    var __handleSaveClick = function(thisEditor, $elem) {
        if (thisEditor.saveListenerCallback) {
            thisEditor.saveListenerCallback(thisEditor);
        }
    };

    var __handleResetClick = function(thisEditor, $elem) {
        if (thisEditor.editor.contentValue !== undefined) {
            thisEditor.editor.setValue(thisEditor.editor.contentValue);
            __markTextForReadOnly(thisEditor, thisEditor.markText);
        }
    };

    var __handleCopyClick = function(thisEditor, $elem){
        var content = thisEditor.editor.getValue();
        if (content) {
            if (window.clipboardData && window.clipboardData.setData) {
                // IE specific code path to prevent textarea being shown while dialog is visible.
                return clipboardData.setData("Text", text);

            } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
                var textarea = document.createElement("textarea");
                textarea.textContent = thisEditor.editor.getValue();
                textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    return document.execCommand("copy");  // Security exception may be thrown by some browsers.
                } catch (ex) {
                    console.warn("Copy to clipboard failed.", ex);
                    thisEditor.createCopyButtonError();
                    return false;
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }
    }

    var __handleUndoClick = function(thisEditor, $elem) {
        if (thisEditor.editor.contentValue !== undefined) {
            thisEditor.editor.undo();
        }
    };

    var __handleRedoClick = function(thisEditor, $elem) {
        if (thisEditor.editor.contentValue !== undefined) {
            thisEditor.editor.redo();
        }
    };

    var __create = function(container, stepName, content) {
        return new editorType(container, stepName, content);
    };

    return {
        //getEditor: __getEditor
        create: __create
    };

})();
