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
var stepContent = (function() {
  "use strict";

  var currentStepName;
  var _steps;
  var hashStepNames = {};   // Maps step's hash to its name.  This contains
                            // more entries than the _steps array because it also
                            // contains elements for sections which appear in the TOC.
  var _defaultWidgets;
  var _mapStepWidgets = {};

  var setSteps = function(steps, defaultWidgets) {
    _steps = steps;
    _defaultWidgets = defaultWidgets;
    __createLinks();
  };

  /*
     1) Create the mapping between the step's name and its hash.  The hash
     for the step is created from its title.  Hashes must be created for
     sections as well as steps. It is created for every entry that appears
     in the Table of Contents (TOC). The hash may be used as the
     URL fragment identifier to go directly to a step or section.

     2) Create a reference to parent step for each section so it can load
     the parent step when selected from the Table of Contents or identified
     in the URL hash.
  */
  var __createLinks = function() {
    var step, section, hashIdentifier;

    for(var i = 0; i < _steps.length; i++){
      step = _steps[i];
      hashIdentifier = __createStepHashIdentifier(step.title);
      hashStepNames[hashIdentifier] = step.name;

      if(step.sections){
        for(var j=0; j<step.sections.length; j++){
          section = step.sections[j];
          hashIdentifier = __createStepHashIdentifier(section.title);
          hashStepNames[hashIdentifier] = section.name;

          section.parent = step;    // Link parent to the section
        }
      }
    }
  };

  /*
   Create the hash identifier for the TOC element.  This identifier
   can be used in the fragment identifier of a URL to indicate which
   page, or part of a page, to go to.

   The identifier is the step or section title converted to lower-case.
   Spaces and apostrophes are changed to dashes (-).
   Existing dashes and underscores are allowed to remain.
   All other characters are removed.

   elementTitle - step or section title (NOT name) which appears in the TOC.
  */
  var __createStepHashIdentifier = function(elementTitle) {
    var stepTitle = elementTitle.toLowerCase();
    // Get rid of any non-alphanumeric character that
    // is not a space, dash, or apostrophe.
    var cleanedStepTitle = stepTitle.replace(/[^\w\s-']/g, '');
    // Replace duplicate spaces with only one.
    var reducedStepTitle = cleanedStepTitle.replace(/\s\s+/g, ' ');
    // Replace spaces and apostrophes with a dash and remove duplicate dashes
    var hashIdentifier = reducedStepTitle.replace(/[\s']/g, '-').replace(/--+/g, '-');
    return hashIdentifier;
  };

  var getCurrentStepName = function() {
    return currentStepName;
  };

  var setCurrentStepName = function(stepName) {    
    currentStepName = stepName;   
  }

  /* 
    Return the step or section name value associated with the hash value.  
    If the hash is not recognized, return an empty string.

    hash - string - hash value for a step.  Created in __createStepHashIdentifier(),
                    so it should NOT be preceeded with '#'.
  */
  var getStepNameFromHash = function(hash) {
    return hashStepNames[hash] ? hashStepNames[hash] : "";
  };

  // Append the element's title to the content
  var __addTitle = function(element, $stepContent) {
      if(!element.title){
        return;
      }
      var hashIdentifier = __createStepHashIdentifier(element.title);
      var newTitle;
      // If the element has a parent, it is a section and should have a h3 tag
      if(element.parent){
        newTitle = $("<h3 class='title' id='" + hashIdentifier + "'></h3>");
      }
      else{
        newTitle = $("<h2 class='title' id='" + hashIdentifier + "'></h2>");
      }
      newTitle.attr('aria-label', element.title);
      newTitle.attr('data-step', element.name);
      newTitle.html(element.title);
      $stepContent.append(newTitle);
  };

  // Append the step description text
  var __addDescription = function(step, $stepContent) {
    if(!step.description){
      return;
    }
    var description = step.description;
    if ($.isArray(description)) {
        $.each(description, function(i, desc) {
            if (desc) {
                if (!__containsHTMLTag(desc)) {
                    description[i] = $('<p>').html(desc).prop('outerHTML'); //Use .text instead of .html for debugging
                }
            }
        });
        description = description.join("");
    }
    var newDescription = $("<div class='description' tabindex='0'></div>");
    newDescription.attr('data-step', step.name);
    newDescription.html(description);
    $stepContent.append(newDescription);
  };

  //Used for the Description rendering (__addDescription)
  //Prevent certain description strings with these HTML tags that should not be wrapped in <p>
  var __containsHTMLTag = function(content) {
    if (content.indexOf("<ul>") !== -1 || content.indexOf("</ul>") !== -1 ||
        content.indexOf("<li>") !== -1 || content.indexOf("</li>") !== -1 ||
        content.indexOf("<h4>") !== -1 || content.indexOf("</h4>") !== -1 ||
        content.indexOf("<instruction>") !== -1 || content.indexOf("</instruction>") !== -1) {
            return true;
        }
    return false;
  };

  // Update the step instruction text
  var __updateInstructions = function(step, $stepContent) {
    var stepName = step.name;

    // Check if any instructions exist for this step
    if(!contentManager.checkIfInstructionsForStep(stepName)){
      return;
    }

    for (var index = 0; index < step.instruction.length; index ++ ) {
      var instruction = contentManager.getInstructionAtIndex(index, stepName);
      instruction = __parseInstructionForActionTag(instruction);
      //console.log("new instruction ", instruction);
      if(instruction){
        // Append the instruction to the bottom of the current content.
        var instr = $(".instructionContent[data-step='" + stepName + "'][data-instruction='" + index + "']");
        instr = __addInstructionTag(stepName, instruction, index);
        $stepContent.append(instr);
      }
    }
  };

  var __addInstructionTag = function (stepName, instruction, index) {
    if (instruction != null) { // Some steps don't have instructions
      var instructionTag = $('<instruction>', {id: stepName + '-instruction-' + index, class: 'instruction', tabindex: 0});
      instructionTag.attr("data-step", stepName); // Set a data tag to identify the instruction block with this step
      if (index > 0) {
        instructionTag.addClass("unavailable");
      }
      //var instrCompleteMark = $('<span>', {class: 'instrCompleteMark glyphicon glyphicon-check'});
      var instructionContentDiv = $("<div class='instructionContent'></div>");
      instructionContentDiv.attr("data-step", stepName); // Set a data tag to identify the instruction  with this step
      instructionContentDiv.attr("data-instruction", index);
      instructionContentDiv.html(instruction);
      //instructionTag.append(instrCompleteMark).append(instructionContentDiv);
      instructionTag.append(instructionContentDiv);
      return instructionTag;
    }
  };

  var __parseInstructionForActionTag = function(instruction) {
    //console.log("instruction: ", instruction);
    if (instruction) {
      if ($.isArray(instruction)) {
        for (var i in instruction) {
          //console.log("str ", desc);
          var instrStr = instruction[i];
          //console.log("instr[" + i + "]", instrStr);
          var newInstrStr = utils.parseActionTag(instrStr);
          //console.log("new instr ", newInstrStr);
          if (newInstrStr) {
            instruction[i] = newInstrStr;
          }
        }
      } else {
        //console.log("single instr ");
        var newInstrStr = utils.parseActionTag(instruction);
        //console.log("new instr ", newInstrStr);
        if (newInstrStr) {
          instruction = newInstrStr;
        }
      }
    }
    return instruction;
  };

  /*
    Searches through a step object (root) to see if the step or one of its
    sections has a name matching stepToFind.

    returns the step or section object if a match is found
  */
  var __findStepFromName = function(root, stepToFind){
    if(root.name === stepToFind){
      return root;
    }
    else if(root.sections){
      for(var i=0; i<root.sections.length; i++){
        var section = __findStepFromName(root.sections[i], stepToFind);
        if(section){
          return section;
        }
      }
    }
  };

  var createGuideContents = function() {
    var $stepContent, step;

    for(var i = 0; i < _steps.length; i++) {
      step = _steps[i];

      $stepContent = $("<div class='sect1' id='" + step.name + "_content'></div>");
      $("#contentContainer").append($stepContent);

      __buildContent(step, $stepContent);
      if(step.sections){
        var $sectionContent;
        for(var j = 0; j < step.sections.length; j++){
          $sectionContent = $("<div class='sect2' id='" + step.sections[j].name + "_content'></div>");
          $stepContent.append($sectionContent);
          __buildContent(step.sections[j], $sectionContent);
        }
      }
    }
    resizeGuideSections();
    createEndOfGuideContent();
  };

  var calculateWidgetHeight = function(percentageHeight, numOfWidgets) { 
    var widgetHeight = "300px";
    var marginHeight = "5";
    var totalMargin = marginHeight * numOfWidgets;
    var rightColumn = $("#code_column:visible");
    if (rightColumn.length > 0) {
        // Get height of visible right column
        var columnHeight = rightColumn.height();
        //var subContainer = $(".subContainerDiv");
        //if (subContainer.length > 0) {
        //   marginHeight = subContainer[0].css("margin-top") * 2;
        //   totalMargin = marginHeight * numOfWidgets;
        //}
        var wHeight = ((columnHeight - totalMargin) * percentageHeight)/100;
        widgetHeight = wHeight + "px";
    } else {
      // Don't dictate the height in single column mode.
      widgetHeight = "auto";
    }
    return widgetHeight;
  }

  
  var _createWidgetInfo = function(step) {
    var widgetInfo = [];

    // populate the widget object with displayType/state
    console.log("step ", step.name);
    if (step.content) {
      $.each(step.content, function(index, content) {
          console.log("display ", content.displayType);
          var widgetObj = {};
          widgetObj.displayType = content.displayType;
          widgetObj.enable = (content.enable === false) ? content.enable : true;
          widgetInfo.push(widgetObj);
      });
    }
    return widgetInfo;
  }

  var getWidgetsInfoForStep = function(step) {
    var defaultPercentage = "50%";
    var widgetInfo = (step.content === undefined ? _defaultWidgets : _createWidgetInfo(step));
    var numOfWidgets = widgetInfo.length;

    // populate the widget object with height
    if (numOfWidgets === 2) {
        for (var i = 0; i < widgetInfo.length; i++) {
           widgetInfo[i].height = defaultPercentage;
        };
    } else if (numOfWidgets === 3) {
        // pod is always 20% height
        var podWidget = widgetInfo[1];
        podWidget.height = "20%";
        
        var browserWidget = widgetInfo[0];
        var editorWidget = widgetInfo[2];
        // if both browser and editor are active then browser is 40%, editor is 40%
        if (browserWidget.enable === true && editorWidget.enable === true) {
            widgetInfo[0].height = "40%";
            widgetInfo[2].height = "40%";
        // if browser is active and editor is nonactive then browser is 60%, editor is 20% 
        } else if (browserWidget.enable === true && editorWidget.enable === false) {
            widgetInfo[0].height = "60%";
            widgetInfo[2].height = "20%";
            console.log("browser 60%, editor")
        // if browser is nonactive and editor is active then browser is 20%, editor is 60%
        } else if (browserWidget.enable === false && editorWidget.enable === true) {
            widgetInfo[0].height = "20%";
            widgetInfo[2].height = "60%";
        }
    }
    return widgetInfo;
  }

  var resizeWidgets = function(widgetInfo, activeWidget) {
    var numOfWidgets = widgetInfo.length;

    // no need to resize if active widget is pod since pod is always constant size
    if (activeWidget === "pod") {
       return;
    }

    // readjust the widgets height
    if (numOfWidgets === 2) {
        var browserWidget = widgetInfo[0];
        var editorWidget = widgetInfo[1];

        if (activeWidget === "webBrowser") {
            browserWidget.height = "60%";
            editorWidget.height = "40%";
        } else if (activeWidget === "tabbedEditor") {
            browserWidget.height = "40%";
            editorWidget.height = "60%";
        }
    } else if (numOfWidgets === 3) {
        var browserWidget = widgetInfo[0];
        var podWidget = widgetInfo[1];
        var editorWidget = widgetInfo[2];

        // pod is always 20% height
        podWidget.height = "20%";

        if (activeWidget === "webBrowser") {
            if (browserWidget.height === "60%") {
              return;
            } else {
              browserWidget.height = "40%";
              editorWidget.height = "40%";
            }
        }
        if (activeWidget === "tabbedEditor") {
            if (editorWidget.height === "60%") {
              return;
            } else {
              browserWidget.height = "40%";
              editorWidget.height = "60%";
            }
        }
    }

    // actual resize of widgets
    for (var i = 0; i < widgetInfo.length; i++) {
        var widgetId = widgetInfo[i].id;
        var widgetContainer = $("#" + widgetId);
        widgetContainer.css("height", widgetInfo[i].height);
    }
  }

  // empty editor object
  var editorObject = {
    "displayType":"fileEditor",
    "fileName": "    ",
    "save": true,
    "activeTab": true
  };

  var __createEmptyWidgets = function(step, widgetContainer, stepWidgets) {
    var displayTypeCounts = {};

    for (var i = 0; i < stepWidgets.length; i++){
        var content = {};
        var widget = stepWidgets[i];
        var displayType = widget.displayType;
        var isEnable = widget.enable;
        
        if (displayTypeCounts[displayType] === undefined){
            displayTypeCounts[displayType] = 0;
        } else {
            displayTypeCounts[displayType]++;
        }
        var displayTypeNum = displayTypeCounts[displayType];
        var subContainerId = step.name + '-' + displayType + '-' + displayTypeNum;
        // data-step attribute is used to look for content of an existing step in __hideContents
        // and __lookForExistingContents.
        var subContainerDivId = '<div id="' + subContainerId + '" data-step="' + step.name + '" class="subContainerDiv col-sm-12"></div>';
        widget.id = subContainerDivId;
        var subContainer = $(subContainerDivId);
        if (isEnable === false) {
           subContainer.addClass('disableContainer');
        }
        widgetContainer.append(subContainer);

        if (displayType === "tabbedEditor") {
            var editorList = [];
            editorList.push(editorObject);
            content.editorList = editorList;
        }
        
        if (widget.height !== undefined) {
            subContainer.css("height", widget.height);
        }
        //var percentageHeight = getWidgetPercentageHeight(numOfWidgets, displayType, isEnable);
        //var widgetHeight = calculateWidgetHeight(percentageHeight, numOfWidgets);
        //console.log("widgetHeight ", widgetHeight);

        //if (widgetHeight !== undefined) {
        //    content.height = widgetHeight;
        //}

        createWidget(step.name, content, displayType, subContainer, displayTypeNum);
    }
  }

  var __buildContent = function(step, $stepContent) {
    contentManager.setInstructions(step.name, step.instruction);

    __addTitle(step, $stepContent);
    __addDescription(step, $stepContent);
    __updateInstructions(step, $stepContent);

    // no need to create widgets for these steps
    if (step.name === "WhatNext" || step.name === "RelatedLinks") {
      return;
    }

    // Insert widgets into the widgets div for its step.
    var stepWidgets;
    if ($(".stepWidgetContainer[data-step='" + step.name + "']").length > 0) {
        stepWidgets = $(".stepWidgetContainer[data-step='" + step.name + "']");
    } else { // create div
        stepWidgets = $("<div class='stepWidgetContainer multicolStepHidden' data-step='" + step.name + "'></div>");
        $("#code_column").append(stepWidgets);
    }

    // build/get widgets info
    // store widgets object for each step in _mapStepWidgets
    var widgetsObjInfo = _mapStepWidgets[step.name];
    if (widgetsObjInfo === undefined) {
        widgetsObjInfo = getWidgetsInfoForStep(step);
        _mapStepWidgets[step.name] = widgetsObjInfo;
    }

    if (step.content) {
        var content = step.content;
        var displayTypeCounts = {}; // Map of displayType to the displayCount for that type
        var numOfWidgets = step.content.length;
        
        $.each(step.content, function(index, content) {
            if (content.displayType) {
                // Create an id for the subContainer using the displayType, starting with 0 for each displayType
                if(displayTypeCounts[content.displayType] === undefined){
                    displayTypeCounts[content.displayType] = 0;
                } else {
                    displayTypeCounts[content.displayType]++;
                }
                // create a new div under the main contentContainer to load the content of each display type
                var displayTypeNum = displayTypeCounts[content.displayType];
                var subContainerDivId = step.name + '-' + content.displayType + '-' + displayTypeNum;
                // data-step attribute is used to look for content of an existing step in __hideContents
                // and __lookForExistingContents.
                var subContainerDiv = '<div id="' + subContainerDivId + '" data-step="' + step.name + '" class="subContainerDiv col-sm-12"></div>';      
                widgetsObjInfo[index].id = subContainerDivId;

                // stepWidgets.hide();
                stepWidgets.append(subContainerDiv);
                var subContainer = $("#" + subContainerDivId);
                // disable the widget if specified
                if (content.enable === false) {
                  subContainer.addClass('disableContainer'); 
                }

                // dynamically setup height for each widget based on each step content
                //var percentageHeight = getWidgetPercentageHeight(numOfWidgets, content.displayType);
                //var widgetHeight = calculateWidgetHeight(percentageHeight, numOfWidgets);
                //content.height = widgetHeight;
                var widgetHeight = widgetsObjInfo[index].height;
                subContainer.css("height", widgetHeight);

                createWidget(step.name, content, content.displayType, subContainer, displayTypeNum);

                var isWidgetEnable = widgetsObjInfo[index].enable;
                subContainer.on("click", function() {
                  //console.log( "Handler for .click() ", subContainerDiv);
                  if (isWidgetEnable !== false) {
                    resizeWidgets(widgetsObjInfo, content.displayType);
                  }
                });

                // listen to onclick on webBrowser content since it's an iframe
                if (content.displayType === "webBrowser") {         
                  var webBrowserContent = subContainer.find('iframe[name="iframeResult"]');
                  console.log("find iframe ", webBrowserContent);
                  webBrowserContent.load(function() {
                    $(this).contents().on("click", function() {
                      console.log("Click detected inside iframe.");
                      resizeWidgets(widgetsObjInfo, content.displayType);
                    });
                  });
                }
            }
      });
    } else {
      // create empty widgets
      __createEmptyWidgets(step, stepWidgets, widgetsObjInfo);
    }
  };

  /* 
   * Update widgets displayed on right-hand side of multipane layout for the specified id.
   * 
   * id - the ID (hash value without the '#') for the given step.
   */
  var showStepWidgets = function(id) {
    if (window.innerWidth >= twoColumnBreakpoint) {
      // Find the stepName based on the ID
      var stepName = getStepNameFromHash(id);
      
      // #codeColumn is showing.   Only display applicable widgets for the step.
      $('.multicolStepShown').removeClass('multicolStepShown').addClass('multicolStepHidden');

      // stepName is "" when srollTop displays guide header, or guide meta.
      if (stepName) {
        // Find the .stepWidgetContainer holding the widgets for the specified step.
        var $selectedStepContainer =  $('.stepWidgetContainer[data-step=' + stepName + ']');
        $selectedStepContainer.removeClass('multicolStepHidden').addClass('multicolStepShown');
      }
    } 
  };

  var createWidget = function(stepName, content, displayType, subContainer, displayTypeNum) {
      switch (displayType) {
          case 'fileEditor':
          editor.create(subContainer, stepName, content).done(function(newEditor){
              contentManager.setEditor(stepName, newEditor, displayTypeNum);
          });
          break;
          case 'tabbedEditor':
          // NOTE! tabbedEditors may not display well in less than 1/2 screen.
          tabbedEditor.create(subContainer, stepName, content).done(function(newTabbedEditor){
              contentManager.setTabbedEditor(stepName, newTabbedEditor, displayTypeNum);
          });
          break;
          case 'commandPrompt':
          cmdPrompt.create(subContainer, stepName, content).done(function(newCmdPrompt){
              contentManager.setCommandPrompt(stepName, newCmdPrompt, displayTypeNum);
          });
          break;
          case 'webBrowser':
          webBrowser.create(subContainer, stepName, content).done(function(newWebBrowser){
              contentManager.setWebBrowser(stepName, newWebBrowser, displayTypeNum);
          });
          break;
          case 'fileBrowser':
          fileBrowser.create(subContainer, content, stepName).done(function(newFileBrowser){
              contentManager.setFileBrowser(stepName, newFileBrowser, displayTypeNum);
          });
          break;
          case 'pod':
          pod.create(subContainer, stepName, content).done(function(newPod){
              contentManager.setPod(stepName, newPod, displayTypeNum);
          });
          break;
      }
  }

  return {
    setSteps: setSteps,
    createStepHashIdentifier: __createStepHashIdentifier,
    getCurrentStepName: getCurrentStepName,
    setCurrentStepName: setCurrentStepName,
    getStepNameFromHash: getStepNameFromHash,
    createGuideContents: createGuideContents,
    showStepWidgets: showStepWidgets
  };
})();
