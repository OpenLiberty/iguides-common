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

    // orderedStepNamesArray: used to map guide step name to the index(step number)
    // in the __steps array.
    var orderedStepNamesArray = [];
    
    // A local pointer to the array of steps represented by this Table Of Contents.
    var __steps;

    var __getNextStepFromName = function(name) {
      var stepIdx = __getStepIndex(name);
      var nextStepName = orderedStepNamesArray[stepIdx+1];
      if(nextStepName){
        __handleFirstStepContent(nextStepName);
      }
      return nextStepName;
    };

    var __getPrevStepFromName = function(name) {
      var stepIdx = __getStepIndex(name);
      var previousStepName = orderedStepNamesArray[stepIdx-1];
      if(previousStepName){
        __handleFirstStepContent(previousStepName);
      }
      return previousStepName;
    };

    var __getStepIndex = function(name) {
      return orderedStepNamesArray.indexOf(name);
    };

    /*
        Creates the table of contents for the BluePrint based on the JSON representation.
        Input: 
          title - string - guide display title
          steps - array - the steps of the BluePrint represented as JSON
    */
    var __create = function(title, steps){
        __steps = steps;   // Save a local pointer to the steps array, managed by step-content.js

        var container = $("#toc_container");
        container.attr("role", "application");
        container.attr("aria-label", "Table of contents");
        $(ID.tableOfContentsTitle).after(container);

        // Loop through the steps and append each one to the table of contents.
        for(var i = 0; i < steps.length; i++){
          var step = steps[i];
          __buildStep(container, step);
        }

    };

    /*
       Creates a list item entry in the table of contents.
       The depth determines how much left-padding the list item has in the table of contents.
       The value is set as the 'TOCIndent' property of the guide's JSON file describing the steps.
       If 'TOCIndent' is not specified in the JSON for the step, a value of '0' is assumed and 
       the step's title appears at the leftmost edge of the TOC.
       Input: container: div - table of contents container for where the list item should be added
              dataTOC: string - data attribute to identify the list item
              title: title to display in the table of contents list item
              depth: how many levels the entry is indented.  '0' is no indent or leftmost edge. 
    */
    var __createListItem = function(container, dataToc, title, depth){
        depth = depth ? depth: 0;

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
       Input: {div} container, {JSON} step
    */
    var __buildStep = function(container, step){
      var listItem = __createListItem(container, step.name, step.title, step.TOCIndent || 0);
       __addOnClickListener(listItem, step);

      // A section is a portion of a step that appears in the TOC as a separate, indented entry
      // following the step's entry.  It appears on the same PAGE as the step, but has its
      // own TOC entry.   Selecting a section's entry in the TOC should load that step's page 
      // and scroll the contents down to the section's header.
      //
      // Build the subsection's table of contents links for this step.
      if(step.sections){
        var sections = step.sections;
        for(var i = 0; i < sections.length; i++){
          var section = sections[i];
          // Create a TOC link to this section, and when clicked on it loads the original step 
          // and then scrolls to the section.
          // Sections, in the TOC, are indented one from their parent.
          var depth = step.TOCIndent ? step.TOCIndent + 1: 1;
          var subStepLink = __createListItem(container, section.name, section.title, depth);
          __addOnClickListener(subStepLink, section);
        }
      }

      // Used for previous/next button functionality.
      // NOTE: sections aren't added to this array since they don't have their own
      //       previous and next buttons.
      orderedStepNamesArray.push(step.name);

    };


    /**
     * Decide if the guide time duration label needs to be shown.
     */
    var __handleFirstStepContent = function(stepName) {
      var isFirstStep = __getStepIndex(stepName) === 0;

      // Only show the duration on the first step
      if(isFirstStep) {
        $(ID.toc_guide_title).hide();
        $(ID.first_step_header).show();       
        
      } else {
        $(ID.toc_guide_title).show();
        $(ID.first_step_header).hide();
      }
    };

    // Scroll the page back up to the content
    var scrollToContent = function(){
      $("html, body").animate({ scrollTop: $("#guide_column").offset().top }, 400);
      $(ID.blueprintDescription).focus();
    };

    /*
        Handler for clicking on a step or section in the table of contents.
        Input: 
          listItem - html <li> item in TOC representing the step or section
          element - JSON containing information for the step or section.
                    element.name is the identity of the element within the DOM.
    */
    var __addOnClickListener = function(listItem, element) {
        var span = listItem.find('.tableOfContentsSpan');
        span.on("click", function(event){
            event.preventDefault();
            event.stopPropagation();


            __handleFirstStepContent(element.parent ? element.parent.name : element.name); // Handle hiding/showing the first step's title
            stepContent.createContents(element);
            
            stepContent.scrollToSection(element.name);                   
            __highlightTableOfContents(element.name);
        });

        span.on("keydown", function(event){
          // Enter key or space key
          if(event.which === 13 || event.which === 32){
            span.click();

            if(__getStepIndex(element.name) === 0){
              $(ID.first_step_header).attr("tabindex","0");
              $(ID.first_step_header).focus();
            }
            else{
              var description = $(".description[data-step='" + element.name + "'");
              if(description && description.length > 0){
                description.focus();
              }
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
    var __selectStep = function(stepObj){     
      __highlightTableOfContents(stepObj.name);

      // Don't show/hide the previous/next buttons based on this section if this is a
      // section of a parent's step.  Sections appear on the same page as its parent step,
      // so they don't have their own previous/next buttons.
      if(stepObj.parent){
        return;
      }

      //Hide the previous and next buttons when not needed
      var stepIndex = orderedStepNamesArray.indexOf(stepObj.name);
      var last = orderedStepNamesArray.length - 1;

      jQuery.fn.visible = function() {
        return this.css('visibility', 'visible');
      };

      jQuery.fn.invisible = function() {
          return this.css('visibility', 'hidden');
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
