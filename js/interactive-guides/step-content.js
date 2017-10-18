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
  
  var setSteps = function(steps) {
    _steps = steps;
    __createLinksToParentSteps();    
  };

  // Create link to parent step for each section so it can load the parent step when clicked on
  var __createLinksToParentSteps = function() {
    // Make links to parents
    for(var i = 0; i < _steps.length; i++){
      var step = _steps[i];
      if(step.sections){
        for(var j=0; j<step.sections.length; j++){
          step.sections[j].parent = step;
        }
      }
    }
  };

  var getCurrentStepName = function() {
    return currentStepName;
  };

  // Hide the previous selected step content by looking for data-step attributes with the data-step not equal to the current step name
  var __hideContents = function() {
    var stepsToBeHidden = $("[data-step][data-step!=" + currentStepName + "]");
    stepsToBeHidden.addClass("hidden");
  };

  // Append the step title
  var __addTitle = function(step) {
    if(!step.title){
      return;
    }
    var newTitle = $("<div class='title'></div>");
    newTitle.attr('aria-label', step.title);
    newTitle.attr('data-step', step.name);
    newTitle.html(step.title);
    $("#contentContainer").append(newTitle);
  };

  // Append the step description text
  var __addDescription = function(step) {
    if(!step.description){
      return;
    }
    var description = step.description;    
    var jointDescription = description;
    if ($.isArray(description)) {
      jointDescription = description.join("<br/>");
    }
    var newDescription = $("<div class='description' tabindex='0'></div>");
    newDescription.attr('data-step', step.name);
    newDescription.html(jointDescription);
    $("#contentContainer").append(newDescription);
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

  var __parseAction = function(instruction) {
    if (instruction) {
      if ($.isArray(instruction)) {
        for (var instr in instruction) {
          var instrStr = instruction[instr];
          //console.log("descStr ", instrStr);
          var parseStringAction = utils.parseActionTag(instrStr);
          //console.log("parseStringAction ", parseStringAction);
          if (parseStringAction) {
            //console.log("string not empty (array) - contains action tag, replace string");
            instruction[instr] = parseStringAction;
          }
        }
      } else {
        var parseStringAction = utils.parseActionTag(instruction);
        //console.log("parseStringAction ", parseStringAction);
        if (parseStringAction) {
          //console.log("string not empty - contains action tag, replace string");
          instruction = parseStringAction;
          //console.log("instruction - ", instruction);
        }
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
      currentInstruction = __addInstructionTag(stepName, currentInstruction, instructionNumber);
      // Check if there is already an instruction for this step, and to append it after that one
      var stepInstructions = $(".instruction[data-step='" + stepName + "']");
      if(stepInstructions.length > 0){
        stepInstructions.last().after(currentInstruction);
      }
      else{
        $("#contentContainer").append(currentInstruction);
      }   
    }
  };

  /*
    Searches for a step JSON from a given step name, and call create contents using that step JSON
  */
  var createContentsFromName = function(stepName){
    for(var i = 0; i < _steps.length; i++){
      var step = _steps[i];
      var stepToLoad = __findStepFromName(step, stepName);
      if(stepToLoad){
        createContents(stepToLoad);
        return;
      }
    }
  };

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
    Before create content for the selected step,
    - hide the content of the previous selected step
    - check whether the content of the selected step has been created before
      - if it has, show the existing content
      - otherwise create the new content
      Inputs: {JSON} step or section 
  */
  var createContents = function(step) {  
    currentStepName = step.name;  
    __hideContents(); // Hide other steps that are not for this step    

    // Check if this is a section of a step. A section appears on the same
    // page as a step, but has its own TOC entry. Sections have a 
    // parent attribute in their JSON indicating which step to load.
    if(step.parent){
      createContents(step.parent);  // Create step page this section is part of
      tableofcontents.selectStep(step);      
      scrollToSection(step.name);
      return;
    }
    else{
      if (!__lookForExistingContents(step)) {
        __buildContent(step);
        if(step.sections){
          for(var i = 0; i < step.sections.length; i++){
            __buildContent(step.sections[i]);
          }
        }
      }
      tableofcontents.selectStep(step);
      currentStepName = step.name;
  
      // Highlight the next button if all of the instructions are complete or there are
      // no instructions
      contentManager.enableNextWhenAllInstructionsComplete(step);
    }    
  };

  var scrollToSection = function(stepname){    
    var focusSection = $(".title[data-step='" + stepname + "']");
    
    // If the section is found scroll to it
    if(focusSection.length > 0){
      $("html, body").animate({ scrollTop: focusSection.offset().top }, 400);
    }
    // Otherwise, scroll to the top of the step
    else{
      scrollToContent();
    }   
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
          if(!displayTypeCounts[content.displayType]){
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

  var __createButton = function(buttonId, buttonName, callbackMethod) {
    return $('<button/>', {
      type: 'button',
      text: buttonName,
      id: buttonId,
      click: eval(callbackMethod)
    });
  };

  var __parseDescriptionForButton = function(step) {
    var description = step.description;
    //console.log("description: ", description);
    //console.log("step.name ", step.name);
    if (description) {
      var buttonArray = [];
      if ($.isArray(description)) {
        for (var desc in description) {
          //console.log("str ", desc);
          var descStr = description[desc];
          //console.log("descStr ", descStr);
          var parseStringButton = utils.parseString(descStr);
          if (parseStringButton) {
            //console.log("string not empty");
            buttonArray.push(parseStringButton);
          } //else {
          //console.log("string is empty");
          //}
        }
      } else {
        var parseStringButton = utils.parseString(description);
        if (parseStringButton) {
          //console.log("string is not empty");
          buttonArray.push(parseStringButton);
        }
      }

      //subContainer.append("<div class=\"buttonContainer\">");
      $(ID.blueprintDescription).append("<br>");
      $(ID.blueprintDescription).append("<div class=\"buttonContainer\">");
      for (var i = 0; i < buttonArray.length; i++) {
        //console.log("button ", buttonArray[i]);
        //var buttonId = subContainer[0].id + "-button-" + i;
        var buttonId = utils.replaceString(buttonArray[i], " ");
        //console.log("id ", buttonId);
        var callbackMethod = "(function test(currentStepName) {circuitBreakerCallBack." + buttonId + "(\"" + currentStepName + "\")})";
        //console.log("callbackMethod ", callbackMethod);

        var button = __createButton(buttonId, buttonArray[i], callbackMethod);
        $(".buttonContainer").append(button);
      }
      //subContainer.append("</div>");
      $(ID.blueprintDescription).append("</div>");
    }
  };

  return {
    setSteps: setSteps,
    scrollToSection: scrollToSection,
    createContentsFromName: createContentsFromName,    
    createContents: createContents,
    getCurrentStepName: getCurrentStepName,
    createInstructionBlock: createInstructionBlock
  };
})();
