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

  var setSteps = function(steps) {
    _steps = steps;
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
        for(var j = 0; j < step.sections.length; j++){
          __buildContent(step.sections[j], $stepContent);
        }
      }
    }
    resizeGuideSections();
    createEndOfGuideContent();
  };

  var __buildContent = function(step, $stepContent) {
    contentManager.setInstructions(step.name, step.instruction);

    __addTitle(step, $stepContent);
    __addDescription(step, $stepContent);
    __updateInstructions(step, $stepContent);

    if (step.content) {
        var content = step.content;
        var displayTypeCounts = {}; // Map of displayType to the displayCount for that type
        var defaultBootstrapColSize = "col-sm-12";

        $.each(step.content, function(index, content) {
            if (content.displayType) {
                var contentBootstrapColSize = defaultBootstrapColSize;
                if (content.size === "100%") {
                    contentBootstrapColSize = "col-sm-12";
                } else if (content.size === "75%") {
                    contentBootstrapColSize = "col-sm-9";
                } else if (content.size === "50%") {
                    contentBootstrapColSize = "col-sm-6";
                } else if (content.size === "40%") {
                    contentBootstrapColSize = "col-sm-5";
                } else if (content.size === "10%") {
                    contentBootstrapColSize = "col-sm-1";
                }

            // Create an id for the subContainer using the displayType, starting with 0 for each displayType
            if(displayTypeCounts[content.displayType] === undefined){
                displayTypeCounts[content.displayType] = 0;
            }
            else{
                displayTypeCounts[content.displayType]++;
            }
            // create a new div under the main contentContainer to load the content of each display type
            var displayTypeNum = displayTypeCounts[content.displayType];
            var subContainerDivId = step.name + '-' + content.displayType + '-' + displayTypeNum;
            // data-step attribute is used to look for content of an existing step in __hideContents
            // and __lookForExistingContents.
            var subContainerDiv = '<div id="' + subContainerDivId + '" data-step="' + step.name + '" class="subContainerDiv ' + contentBootstrapColSize + '"></div>';
    //          var mainContainer = $('#contentContainer');
            //console.log(mainContainer);
    //          mainContainer.append(subContainerDiv);


            // Insert widgets into the widgets div for its step.
            var stepWidgets;
            if ($("#"+ step.name + "_widgets").length > 0) { // if div found
                stepWidgets = $("#"+ step.name + "_widgets");
            } else { // create div
                stepWidgets = $("<div id='" + step.name + "_widgets'></div>");
                $("#code_column").append(stepWidgets);
            }
            stepWidgets.hide();
            stepWidgets.append(subContainerDiv);

            // $("#code_column").append(subContainerDiv);

            var subContainer = $("#" + subContainerDivId);

            //console.log("displayType: ", content.displayType);
            switch (content.displayType) {
                case 'fileEditor':
                editor.create(subContainer, step.name, content).done(function(newEditor){
                    contentManager.setEditor(step.name, newEditor, displayTypeNum);
                });
                break;
                case 'tabbedEditor':
                // NOTE! tabbedEditors may not display well in less than 1/2 screen.
                content.bootstrapColSize = contentBootstrapColSize;  // The tabbedEditor needs to know
                                                                    // the width of its containr to
                                                                    // determine the size of its tabs.
                tabbedEditor.create(subContainer, step.name, content).done(function(newTabbedEditor){
                    contentManager.setTabbedEditor(step.name, newTabbedEditor, displayTypeNum);
                });
                break;
                case 'commandPrompt':
                cmdPrompt.create(subContainer, step.name, content).done(function(newCmdPrompt){
                    contentManager.setCommandPrompt(step.name, newCmdPrompt, displayTypeNum);
                });
                break;
                case 'webBrowser':
                webBrowser.create(subContainer, step.name, content).done(function(newWebBrowser){
                    contentManager.setWebBrowser(step.name, newWebBrowser, displayTypeNum);
                });
                break;
                case 'fileBrowser':
                fileBrowser.create(subContainer, content, step.name).done(function(newFileBrowser){
                    contentManager.setFileBrowser(step.name, newFileBrowser, displayTypeNum);
                });
                break;
                case 'pod':
                pod.create(subContainer, step.name, content).done(function(newPod){
                    contentManager.setPod(step.name, newPod, displayTypeNum);
                });
                break;
            }
            }
      });
    }
  };

  return {
    setSteps: setSteps,
    createStepHashIdentifier: __createStepHashIdentifier,
    getCurrentStepName: getCurrentStepName,
    setCurrentStepName: setCurrentStepName,
    getStepNameFromHash: getStepNameFromHash,
    createGuideContents: createGuideContents
  };
})();
