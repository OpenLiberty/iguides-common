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
var tableofcontents = (function() {
    "use strict";

    //orderedStepArray: populated with the guide steps in order in which whey will be followed
    //orderedStepNamesArray: will used to map guide step name to the index(step number)
    var orderedStepArray = [];
    var orderedStepNamesArray = [];


    var __getNextStepFromName = function(name) {
      var stepIdx = __getStepIndex(name);
      var nextStep = orderedStepArray[stepIdx+1];
      if(nextStep){
        __handleFirstStepContent(nextStep);
      }
      return nextStep;
    };

    var __getPrevStepFromName = function(name) {
      var stepIdx = __getStepIndex(name);
      var previousStep = orderedStepArray[stepIdx-1];
      if(previousStep){
        __handleFirstStepContent(previousStep);
      }
      return previousStep;
    };

    var __getStepIndex = function(name) {
      return orderedStepNamesArray.indexOf(name);
    };

    /*
        Creates the table of contents for the BluePrint based on the JSON representation.
        Input: The steps of the BluePrint represented as JSON
    */
    var __create = function(title, steps){
        var container = $("#toc_container");
        container.attr("role", "application");
        container.attr("aria-label", "Table of contents");
        $(ID.tableOfContentsTitle).after(container);

        // Loop through the steps and append each one to the table of contents.
        for(var i = 0; i < steps.length; i++){
          var step = steps[i];
          __buildStep(container, step, 0);
        }

        // Focus the selected step when shift-tabbing from the main content
        $("#blueprint_description").on('keydown', function(event){
          if(event.which === 9 && event.shiftKey){
            event.preventDefault();
            event.stopPropagation();
            if($("#tags_container > a").length > 0){
              $("#tags_container > a").last().focus();
            }
            else{
              $(".selectedStep > span").focus();
            }
          }
        });
    };

    /*
       Creates a list item for the table of contents
       The depth determines how much left-padding the step list item has in the table of contents.
       Inputs: container: table of contents container for where the list item should be added
               dataTOC: data attribute to identify the list item
               title: Title to display in the table of contents list item
               depth: How many levels down the step is 
    */
    var __createListItem = function(container, dataToc, title, depth){
        var listItem = $("<li class='tableOfContentsStep'></li>");
        listItem.attr('data-toc', dataToc);
        // Indent based on depth
        listItem.css('margin-left', depth * 30 + 'px');
      
        // Create a span and set the text and attributes
        var span = $("<span class='tableOfContentsSpan'>");
        span.attr('tabindex', '0');
        span.attr('aria-label', title);
        span.text(title);

        // Append the span to the list item and then add it to the container
        listItem.append(span);
        container.append(listItem);
        return listItem;
    };

    /*
       Parses a given step and adds it to the container
       Depth is the given depth of the tree so that it can recursively create steps. The depth determines
       how much left-padding the step list item has in the table of contents.
       Input: {div} container, {JSON} step, {number} depth
    */
    var __buildStep = function(container, step, depth){
      var listItem = __createListItem(container, step.name, step.title, depth);
       __addOnClickListener(listItem, step, step.name);

      // Build the subsections table of contents links for this step using the data-subsection attributes contained in this description
      if(step.sections){
        var sections = step.sections;
        for(var i = 0; i < sections.length; i++){
          // Create a toc link to this section, and when clicked on it loads the original step and then scrolls to the section
          var subStepLink = __createListItem(container, sections[i], sections[i], depth + 1);
          __addOnClickListener(subStepLink, step, sections[i], sections[i]);
        }
      }

      //used for previous/next button functionality
      orderedStepArray.push(step);
      orderedStepNamesArray.push(step.name);

      // Handle children steps recursively if the step has sub-steps.
      if(step.steps !== undefined && step.steps !== null){
        for(var i = 0; i < step.steps.length; i++){
          var child = step.steps[i];
          __buildStep(container, child, depth + 1);
        }
      }
    };


    /**
     * Decide if the guide time duration label needs to be shown.
     */
    var __handleFirstStepContent = function(step) {
      // Only show the duration on the first step
      if(__getStepIndex(step.name) != 0) {
        $(ID.toc_guide_title).show();
        $(ID.first_step_header).hide();
      } else {
        // It is first step
        $(ID.toc_guide_title).hide();
        $(ID.first_step_header).show();
      }
    };

    // Scroll the page back up to the content
    var scrollToContent = function(){
      $("html, body").animate({ scrollTop: $("#guide_column").offset().top }, 400);
      $(ID.blueprintDescription).focus();
    };

    /*
        Handler for clicking on a step in the table of contents.
        @param - `span` is the span of the step in the table of contents
        @param - `step` is the JSON containing information for the step
    */
    var __addOnClickListener = function(listItem, step, dataToc, section) {
        var span = listItem.find('.tableOfContentsSpan');
        span.on("click", function(event){
            event.preventDefault();
            event.stopPropagation();
            __handleFirstStepContent(step);
            stepContent.createContents(step);

            // If the listItem is for a subsection scroll to it after loading the step
            var focusSection = $("[data-section='" + section + "']");
            if(section && focusSection.length > 0){
              $("html, body").animate({ scrollTop: focusSection.offset().top }, 400);
            }
            // Otherwise, scroll to the top of the step
            else{
              scrollToContent();
            }            

            __highlightTableOfContents(dataToc);
        });

        span.on("keydown", function(event){
          // Enter key or space key
          if(event.which === 13 || event.which === 32){
            span.click();
            if(__getStepIndex(step.name) != 0) {
              $(ID.blueprintDescription).focus();
            } else { //accessibility: read first_step_header info on first step
              $(ID.first_step_header).attr("tabindex","0");
              $(ID.first_step_header).focus();
            }
          }
        });

        // Prevent the focus state when clicking
        listItem.on("mousedown", function(event){
          event.preventDefault();
          event.stopPropagation();
        });
    };

    var getStepElement = function(name){
      return $("[data-toc='" + name + "']");
    };

    var __highlightTableOfContents = function(name){
      // Clear previously selected step and highlight step
      $('.selectedStep').removeClass('selectedStep');
      var $step = getStepElement(name);
      $step.addClass('selectedStep');
    };

    /*
        Handles 1. table of content steps clicks and 2. Prev/Next step button clicks
        Select the step in the table of contents.
    */
    var __selectStep = function(stepObj, navButtonClick){     
      __highlightTableOfContents(stepObj.name);

      //Hide the previous and next buttons when not needed
      var stepIndex = orderedStepNamesArray.indexOf(stepObj.name);
      var last = orderedStepNamesArray.length - 1;

      jQuery.fn.visible = function() {
        return this.css('visibility', 'visible');
      };

      jQuery.fn.invisible = function() {
          return this.css('visibility', 'hidden');
      };

      jQuery.fn.visibilityToggle = function() {
          return this.css('visibility', function(i, visibility) {
              return (visibility == 'visible') ? 'hidden' : 'visible';
          });
      };

      if (stepIndex == 0) {
        $(ID.prevButton).invisible();
      } else {
        $(ID.prevButton).visible();
      }
      if (stepIndex == last) {
        $(ID.nextButton).invisible();
      } else {
        $(ID.nextButton).visible();
      }
    };

    return {
      create: __create,
      scrollToContent: scrollToContent,
      getStepElement: getStepElement,
      selectStep: __selectStep,
      nextStepFromName: __getNextStepFromName,
      prevStepFromName: __getPrevStepFromName
    };

})();
