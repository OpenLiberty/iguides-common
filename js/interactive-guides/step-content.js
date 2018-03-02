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
     URL fragment identifier to go directly to a step or section.  They
     also enable the browser's previous and next buttons since each page
     is now identified by a hash value.

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

  /* 
    Return the step or section name value associated with the hash value.  
    If the hash is not recognized, return an empty string.

    hash - string - hash value for a step.  Created in __createStepHashIdentifier().
  */
  var __getStepNameFromHash = function(hash) {
    return hashStepNames[hash] ? hashStepNames[hash] : "";
  }

  /*
    Hide the previously selected step content by looking for data-step attributes
    with the data-step not equal to the current step name.

    stepName - the step name value.   An empty string or 'undefined' will clear
               all steps from the display.
  */
  var __hideContents = function(stepName) {
    if (stepName) {
      var stepsToBeHidden = $("[data-step][data-step!=" + stepName + "]");
      stepsToBeHidden.addClass("hidden");  
    } else {
      // clear all contents
      $("[data-step]").addClass("hidden");
    }
  };

  /*
     Decide if the guide time duration label needs to be shown.

     stepName - the step name value
  */
    var __handleFirstStepContent = function(stepName) {
      var isFirstStep = tableofcontents.getStepIndex(stepName) === 0;

      // Only show the duration on the first step
      if(isFirstStep) {
        $(ID.toc_guide_title).hide();
        $(ID.first_step_header).show();               
      } else {
        $(ID.toc_guide_title).show();
        $(ID.first_step_header).hide();
      }
    };

  // Append the element's title to the content
  var __addTitle = function(element) {
    if(!element.title){
      return;
    }
    var newTitle;
    // If the element has a parent, it is a section and should have a h3 tag
    if(element.parent){
      newTitle = $("<h3 class='title'></h3>");
    }
    else{
      newTitle = $("<h2 class='title'></h2>");
    }    
    newTitle.attr('aria-label', element.title);
    newTitle.attr('data-step', element.name);
    newTitle.html(element.title);
    $("#contentContainer").append(newTitle);
  };

  // Append the step description text
  var __addDescription = function(step) {
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
    $("#contentContainer").append(newDescription);

    if (step.name === "RelateGuides") {
      insertRelateGuidesContent();  
    }
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

  var insertRelateGuidesContent = function() {
    // Kin's code put the relate guides content in the wrong place
    // there's no way for him to know where to insert correctly
    // and there's no way for us to get the content and insert where we can
    // we copy the contents from Kin's and do a clone, remove the hidden and insert it to the right place
    var relateGuides = $("#related-guides");
    if (relateGuides.length > 0) {
      var newRG = $("#related-guides").clone().removeClass("hidden")
      var rGDiv = $("#relateGuidesContent");
      rGDiv.append(newRG);
      relateGuides.empty();
    }
  };

  // Update the step instruction text
  var __updateInstructions = function(step) {
    var stepName = step.name;

    var index = 0;
    // Check if any instructions exist for this step
    if(!contentManager.checkIfInstructionsForStep(stepName)){
      return;
    }
    var lastLoadedInstruction = contentManager.getCurrentInstructionIndex(stepName);
    // Reached the end of the instructions, so get the last index
    if(lastLoadedInstruction === -1){
      lastLoadedInstruction = contentManager.getInstructionsLastIndex(stepName);
    }
    do {
      var instruction = contentManager.getInstructionAtIndex(index, stepName);
      instruction = __parseInstructionForActionTag(instruction);
      //console.log("new instruction ", instruction);
      // Special instruction to track whether the user has completed something but the instruction should not be shown in the DOM.
      if(instruction && instruction.indexOf("NOSHOW") !== 0){
        // If the instruction already exists in the page, then show it. Otherwise append it to the bottom of the current content. 
        var instr = $(".instructionContent[data-step='" + stepName + "'][data-instruction='" + index + "']");
        if(instr.length > 0){
          instr.show();
        }
        else{
          instr = __addInstructionTag(stepName, instruction, index);
          // Check if there is already an instruction for this step, and to append it after that one
          var stepInstructions = $(".instructionContent[data-step='" + stepName + "']");
          if(stepInstructions.length > 0){
            stepInstructions.last().after(instr);
          }
          else{
            $("#contentContainer").append(instr);
          }          
        }            
        
        contentManager.addCheckmarkToInstruction(stepName, index);        
      }
      index++;      
    } while (index <= lastLoadedInstruction);

    // Load this step's sections instructions
    if(step.sections){
      for(var i = 0; i < step.sections.length; i++){
        var section = step.sections[i];
        __updateInstructions(section);
      }
    }        
  };

  var __addInstructionTag = function (stepName, instruction, index) {
    if (instruction != null) { // Some steps don't have instructions
      var instructionTag = $('<instruction>', {id: stepName + '-instruction-' + index, class: 'instruction', tabindex: 0});
      instructionTag.attr("data-step", stepName); // Set a data tag to identify the instruction block with this step
      var instrCompleteMark = $('<span>', {class: 'instrCompleteMark glyphicon glyphicon-check'});
      var instructionContentDiv = $("<div class='instructionContent'></div>");      
      instructionContentDiv.attr("data-step", stepName); // Set a data tag to identify the instruction  with this step
      instructionContentDiv.attr("data-instruction", index);
      instructionContentDiv.html(instruction);
      instructionTag.append(instrCompleteMark).append(instructionContentDiv);
      return instructionTag;
    }
  };

  var createInstructionBlock = function(stepName){
    var currentInstruction = contentManager.getCurrentInstruction(stepName);
    var instructionNumber = contentManager.getCurrentInstructionIndex(stepName);    
    if(currentInstruction){
      currentInstruction = __parseInstructionForActionTag(currentInstruction);
      //console.log("new currentInstruction ", currentInstruction);
      currentInstruction = __addInstructionTag(stepName, currentInstruction, instructionNumber);
      // Check if there is already an instruction for this step, and to append it after that one
      var stepInstructions = $(".instruction[data-step='" + stepName + "']");
      if(stepInstructions.length > 0){
        // If the other step's instructions are hidden then this instruction should be hidden because the user switched steps before the instruction was created.
        if($(".instruction[data-step='" + stepName + "']:visible").length === 0){
          currentInstruction.addClass('hidden');
        }
        stepInstructions.last().after(currentInstruction);
      }
      else{
        $("#contentContainer").append(currentInstruction);
      }   
      __addMarginToLastInstruction();
      
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

  var __addMarginToLastInstruction = function(){
    // Add padding to the last instruction to not overlap the step's content
    $('.lastInstruction').removeClass('lastInstruction');
    $(".instruction:visible:last").addClass('lastInstruction');
  };

  /*
    Searches for a step JSON from a given step name, and calls createContents
    using that step JSON.
  */
  var createContentsFromName = function(stepName){
    if (stepName) {
      for(var i = 0; i < _steps.length; i++){
        var step = _steps[i];
        var stepToLoad = __findStepFromName(step, stepName);
        if(stepToLoad){
          createContents(stepToLoad, true);
          return;
        }
      }
    }
    // If we haven't returned yet, then the stepName is not valid for this guide
    // or was blank.
    // Default to the first page of the guide.  Set the URL appropriately.
    __defaultToFirstPage();
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
  
  /*
    Shows the first page of the guide, but not selected.  Therefore, the
    fistSetpHeader is seen.

    This situation occurs when we first enter the guide or when a unknown
    hash is provided in the URL.
  */
  var __defaultToFirstPage = function() {
    window.location.hash = "";
    currentStepName = "";
    $('.selectedStep').removeClass('selectedStep');
    createContents(_steps[0], false);
  }

  /*
    Calls createContents() for the step associated with the inputted
    hash value.  If no step is associated with the hashValue, the first
    page is shown.
  */
  var createContentsFromHash = function(hashValue) {
    var requestedStepName = __getStepNameFromHash(hashValue);
    if (requestedStepName) {
      createContentsFromName(requestedStepName);      
    } else {
      // If the hash did not point to an existing step, default
      // to show the first step of the guide but don't have it selected
      // since it was not specified.
      __defaultToFirstPage();
    }
  };

  /*
    Before create content for the selected step,
    - hide the content of the previous selected step
    - check whether the content of the selected step has been created before
      - if it has, show the existing content
      - otherwise create the new content
      Inputs: {JSON} step or section 
              boolean - selectStep - true if step should be selected after created
                                     false step created should not be selected
  */
  var createContents = function(step, selectStep) {  
    // Check if this is a section of a step. A section appears on the same
    // page as a step, but has its own TOC entry. Sections have a 
    // parent attribute in their JSON indicating which step to load.
    if(step.parent){
      createContents(step.parent, false);  // Create step page this section is part of
      tableofcontents.selectStep(step);
      return;
    }
    else{
      currentStepName = step.name;
      __hideContents(step.name);      // Hide other steps that are not for this step
      __handleFirstStepContent(step.name);
            
      if (!__lookForExistingContents(step)) {
        __buildContent(step);
        if(step.sections){
          for(var i = 0; i < step.sections.length; i++){
            __buildContent(step.sections[i]);
          }
        }
      }
      
      tableofcontents.addPreviousNext(step);

      if (selectStep) {   // Mark this step as selected.
        tableofcontents.selectStep(step);       
      } 
 
      // Highlight the next button if all of the instructions are complete or there are
      // no instructions
      contentManager.enableNextWhenAllInstructionsComplete(step);
    }
    
    __addMarginToLastInstruction();
  };

  var __buildContent = function(step) {
    contentManager.setInstructions(step.name, step.instruction);

    __addTitle(step);
    __addDescription(step);
    __updateInstructions(step);    

    if (step.content) {
      var content = step.content;        
      var displayTypeCounts = {}; // Map of displayType to the displayCount for that type
      var defaultBootstrapColSize = "col-sm-12";
      // two contents will be side by side. Otherwise, it will be stack on top of each other.
      if (step.content.length == 2) {
        defaultBootstrapColSize = "col-sm-6";
      }
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
          var mainContainer = $('#contentContainer');
          //console.log(mainContainer);
          mainContainer.append(subContainerDiv);
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

  // Look for step content using data-step attribute with the step name in it
  var __lookForExistingContents = function(step) {
    var existingStep = $("[data-step=" + step.name + "]");
    if (existingStep.length > 0) {
      existingStep.removeClass("hidden");
      // Look for any sections of this step and show them.  Sections appear on 
      // the same page as a step, but have their own TOC entry.
      if(step.sections){
        for(var i = 0; i < step.sections.length; i++){
          var section = step.sections[i];
          var existingSection = $("[data-step=" + section.name + "]");
          if(existingSection.length > 0){
            existingSection.removeClass("hidden");
          }
        }
      }
      return true;
    }
    return false;
  };

  var updateURLfromStepName = function(stepName) {
    var hashName = "";
    $.each(hashStepNames, function(key, value){
      if (value === stepName) {
        hashName = key;
        return false;
      }
    });

    __updateURLwithStepHash(hashName);
  }

  var updateURLfromStepTitle = function(stepTitle) {
    var hashName = __createStepHashIdentifier(stepTitle);

    if (!hashStepNames[hashName]) {
      hashName = "";
    }

    __updateURLwithStepHash(hashName);
  }

  var __updateURLwithStepHash = function(hashName) {
    var URL = location.href;
    if (URL.indexOf('#') != -1) {
      URL = URL.substring(0, URL.indexOf('#'));
    }

    if (hashName) {
      URL += '#' + hashName;      
    }

    location.href = URL;
  }

  return {
    setSteps: setSteps,
    createContentsFromName: createContentsFromName,
    createContentsFromHash: createContentsFromHash,    
    createContents: createContents,
    getCurrentStepName: getCurrentStepName,
    createInstructionBlock: createInstructionBlock,
    handleFirstStepContent: __handleFirstStepContent,
    updateURLfromStepName: updateURLfromStepName,
    updateURLfromStepTitle: updateURLfromStepTitle
  };
})();
