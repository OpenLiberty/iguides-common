var editor = (function() {
    var __editors = {}; // ToDo: __editors is no longer needed with the new changes

    var editorType = function(container, stepName, content) {
        this.stepName = stepName;
        this.saveListenerCallback = null;
        this.fileName = "";
        __loadAndCreate(this, container, stepName, content);
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
            this.editor.replaceRange('\n' + content, {line: lineNumber-2});
            this.editor.markText({line: lineNumber-2}, {line: markTextToLineNumber}, {className: "insertTextColor", readOnly: false})
        },
        // append content after the specified line number
        appendContent: function(lineNumber, content, numberOfLines) {
            var markTextToLineNumber = lineNumber;
            if (numberOfLines !== undefined) {
                markTextToLineNumber = lineNumber - 1 + numberOfLines;
            }
            this.editor.replaceRange('\n' + content, {line: lineNumber-1});
            this.editor.markText({line: lineNumber-1}, {line: markTextToLineNumber}, {className: "insertTextColor", readOnly: false})
        },
        // replace content from and to the specified line number
        replaceContent: function(fromLineNumber, toLineNumber, content, numberOfLines) {
            var markTextToLineNumber = fromLineNumber - 1 + (toLineNumber - fromLineNumber )
            this.editor.replaceRange('\n' + content, {line: fromLineNumber-2}, {line: toLineNumber-1});
            if (numberOfLines !== undefined) {
                markTextToLineNumber = fromLineNumber - 2 + numberOfLines;
            }
            this.editor.markText({line: fromLineNumber-2}, {line: markTextToLineNumber}, {className: "insertTextColor", readOnly: false})
        },
        addSaveListener: function(callback) {
            //console.log("saveListener callback", callback);
            this.saveListenerCallback = callback;
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
        }
    };

    var __loadAndCreate = function(thisEditor, container, stepName, content) {
            //console.log("using ajax to load editor.html", container);
            $.ajax({
                context: thisEditor,
                url: "/guides/iguides-common/html/interactive-guides/editor.html",
                async: false,
                cache: true,
                success: function (result) {
                    container.append($(result));
                    if (content.fileName) {
                        container.find('.editorContainer').attr("aria-label", content.fileName + " editor");
                        container.find('.editorFileName').text(content.fileName);
                        thisEditor.fileName = content.fileName;
                        //$(".editorContainer").css("margin-top", "-20px");
                        container.find(".editorContainer").css("margin-top", "-20px");
                    }
                    var editor = container.find('.codeeditor');
                    //console.log("container id", container[0].id);
                    var id = container[0].id + "-codeeditor";
                    editor.attr("id", id);
                    __createEditor(thisEditor, id, container, stepName, content);
                    return this;
                },
                error: function (result) {
                    //console.error("Could not load the edittor.html");
                }
            });
    };

    var __createEditor = function(thisEditor, id, container, stepName, content) {
        var isReadOnly = false;
        var markText = [];
        if (content.readonly === true || content.readonly === "true") {
            isReadOnly = true;
        } else if ($.isArray(content.readonly)) {
           markText = __adjustReadOnlyLines(content.readonly);
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
        // mark any readOnly lines
        thisEditor.markText = markText;
         // $.each(markText, function(index, readOnlyFromAndTo) {
         //$.each(markText, function(index, readOnlyFromAndTo) {		 +            thisEditor.editor.markText({line: readOnlyFromAndTo.from}, {line: readOnlyFromAndTo.to}, {readOnly: true, className: "readonlyLines"});
         //    thisEditor.editor.markText({line: readOnlyFromAndTo.from}, {line: readOnlyFromAndTo.to}, {readOnly: true, className: "readonlyLines"});		 +        });
         //});
         __markTextForReadOnly(thisEditor, thisEditor.markText);

        /*
        $(".editorSaveButton .glyphicon-save-file").text(messages.saveButton);
        if (content.save === false && content.save !== undefined) {
            $(".editorSaveButton").addClass("hidden");
        }
        */
        var saveButton = container.find(".editorSaveButton");
        saveButton.attr('title', messages.saveButton);
        var resetButton = container.find(".editorResetButton");
        resetButton.attr('title', messages.resetButton);
        var undoButton = container.find(".editorUndoButton");
        undoButton.attr('title', messages.undoButton);
        var redoButton = container.find(".editorRedoButton");
        redoButton.attr('title', messages.redoButton);
        var runButton = container.find(".editorRunButton");
        runButton.attr('title', messages.runButton);

        if ((content.save === false || content.save === "false")) {
            saveButton.addClass("hidden");
        } else if ((content.save === true || content.save === "true")) {
            runButton.addClass("hidden");
        }
        //console.log($('#' + id.substring(0, id.indexOf('-codeeditor')) + ' .editorSaveButton'));
        //__addOnClickListener(thisEditor, $('#' + id.substring(0, id.indexOf('-codeeditor')) + ' .editorSaveButton'));
        __addSaveOnClickListener(thisEditor, saveButton);
        __addResetOnClickListener(thisEditor, resetButton);
        __addUndoOnClickListener(thisEditor, undoButton);
        __addRedoOnClickListener(thisEditor, redoButton);
        __addSaveOnClickListener(thisEditor, runButton);

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

    var __markTextForReadOnly = function(thisEditor, markText) {
         $.each(markText, function(index, readOnlyFromAndTo) {
             thisEditor.editor.markText({line: readOnlyFromAndTo.from}, {line: readOnlyFromAndTo.to}, {readOnly: true, className: "readonlyLines"});
         });
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
            thisEditor.saveListenerCallback();
        }
    };

    var __handleResetClick = function(thisEditor, $elem) {
        if (thisEditor.editor.contentValue !== undefined) {
            thisEditor.editor.setValue(thisEditor.editor.contentValue);
            __markTextForReadOnly(thisEditor, thisEditor.markText);
        }
    };

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
