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
var blueprint = (function(){
  var create = function(blueprintName) {
    __load().done(function(){
          __setupLocalSession();
          var steps = jsonGuide.getSteps(blueprintName);
          var defaultWidgets = jsonGuide.getStepsDefaultWidgets(blueprintName);
          var configWidgets = jsonGuide.getStepsConfigWidgets(blueprintName);
          stepContent.setSteps(steps, defaultWidgets, configWidgets);
          tableofcontents.create(steps);          
          stepContent.createGuideContents();
          iguideMultipane.initView();
      
          // Monitor for hash changes to show the requested page.
          // Hash changes occur when the URL is updated with a new hash
          // value (as in someone bookmarked one of the pages) or when a new
          // page is selected from the table of contents.
          // HashChange event processing also occurs in content\common-multipane.js.
          window.addEventListener("hashchange", function(){
            event.preventDefault();

            var hash = location.hash.substring(1);
            stepContent.setCurrentStepName(stepContent.getStepNameFromHash(hash));
          });

          if (window.location.hash !== "") {   
            handleFloatingTableOfContent();
            
            // The URL fragment indentifier (first hash (#) after the URL) indicates
            // the user requested a specific page within the guide.  Go to it.
            var hash = location.hash;
            accessContentsFromHash(hash);
            // Match the widgets on the right to id
            stepContent.showStepWidgets(hash.substring(1));
            stepContent.setCurrentStepName(stepContent.getStepNameFromHash(hash.substring(1)));
          } else {
            // no hash -> at the top of the guide
            accessContentsFromHash(location.hash);
            // Show the widgets on the right for Intro step
            stepContent.showStepWidgets(location.hash);
          }

          $(window).on('scroll', function(event) {
            // Check if a scroll animation from another piece of code is taking
            // place and prevent normal behavior.
            // NOTE: 'scrolling' flag is set in common-multipane.js accessContentsFromHash()
            //       to indicate when scrolling to a selected section is in progress.
            if($("body").data('scrolling') === true) {
                return;
            }
            handleSectionChanging(event);
          });
          setInitialTOCLineHeight();
          setupClipboardCopy();
    });    
  };
 
  var __load = function() {
    var deferred = new $.Deferred();
    $.ajax({
      url: "/guides/iguides-common/html/interactive-guides/blueprint.html",
      async: true,
      success: function (result) {
        $("#guide_content").append($(result));
        deferred.resolve();
      },
      error: function (result) {
        console.error("Could not load blueprint.html");
        deferred.resolve();
      }
    });
    return deferred;
  };

  var __setupLocalSession = function () {
    if (typeof (Storage) !== "undefined") {
      $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
        if (options.cache) {
          var success = originalOptions.success || $.noop,
            url = originalOptions.url;

          options.cache = false; //remove jQuery cache as we have our own localStorage
          options.beforeSend = function () {
            if (window.sessionStorage.getItem(url)) {
              success(window.sessionStorage.getItem(url));
              return false;
            }
            return true;
          };
          options.success = function (data, textStatus) {
            window.sessionStorage.setItem(url, data);
            if ($.isFunction(success)) {
              success(data); //call back to original ajax call
            }
          };
        }
      });
    }
  };

  var handleSectionChanging = function(event) {
    // Get the id of the section most in view
    var id = getScrolledVisibleSectionID();

    if (id !== null) {
      var windowHash = window.location.hash;
      var scrolledToHash = id === "" ? id : '#' + id;
      if (windowHash !== scrolledToHash) {
        // Update the URL hash with new section we scrolled into....
        var currentPath = window.location.pathname;
        var newPath = currentPath.substring(currentPath.lastIndexOf('/')+1) + scrolledToHash;
        // Not setting window.location.hash here because that causes an
        // onHashChange event to fire which will scroll to the top of the
        // section.  pushState updates the URL without causing an
        // onHashChange event.
        history.pushState(null, null, newPath);

        // Update the selected TOC entry
        updateTOCHighlighting(id);  // In toc-multipane.js in openliberty.io
      }
      stepContent.setCurrentStepName(stepContent.getStepNameFromHash(id));
    }
    
    if(window.innerWidth > twoColumnBreakpoint) {
      // Multipane view
      // Match the widgets on the right to the new id
      stepContent.showStepWidgets(id);
    }
  };

  var setupClipboardCopy = function() {
    // offset, target, target_position, target_width, and target_height are global variables in guide.js
    // var target_topMargin;
    // $('#guide_column codeblock').on('mouseenter', function(event) {
    //     offset = $('#guide_column').position();	
    //     target = event.currentTarget;	
    //     var current_target_object = $(event.currentTarget);
    //     target_position = current_target_object.position();
    //     target_topMargin = parseInt(current_target_object.css('margin-top'));
    //     target_width = current_target_object.outerWidth();
    //     target_height = current_target_object.outerHeight();

    //     $('#copy_to_clipboard').css({
    //       top: target_position.top + target_topMargin + 1,
    //        // backward calculation: calculate the x position till the end of the code block, then subtract the width for the copy icon to be displayed
    //       left: target_position.left + target_width - 39
    //     });
    //     $('#copy_to_clipboard').stop().fadeIn();
    // }).on("mouseleave", function(event) {
    //     if (offset) {
    //       var x = event.clientX - offset.left;
    //       var y = event.clientY - offset.top + $(window).scrollTop();
    //       if (!(x > target_position.left
    //         && x < target_position.left + target_width
    //         && y > target_position.top + target_topMargin // need to factor in top margin to calculate the y co-ordinate
    //         && y < target_position.top + target_topMargin + target_height)) {
    //         $('#copy_to_clipboard').stop().fadeOut();
    //         $('#guide_section_copied_confirmation').stop().fadeOut();
    //       }
    //     }
    // });

    // $('#copy_to_clipboard').on('click',function(event) {
    //   event.preventDefault();
    //   openliberty.copy_element_to_clipboard(target, function() {
    //     var current_target_object = $(event.currentTarget);
    //     var position = current_target_object.position();
    //     $('#guide_section_copied_confirmation').css({
    //         top: position.top - 16,
    //         // backward calculation: calculate the x position till the end of the copy icon, then subtract the width for the copied sentence and take into account of the margin available
    //         left: position.left + current_target_object.outerWidth() - 97
    //     }).stop().fadeIn().delay(3500).fadeOut();
    //   });
    // });

  $('#guide_column codeblock').each(function (){
    $(this).wrap('<div class="code_block_wrapper" title="Code block"></div>');  
  })
  $('.code_block_wrapper').each(function (){
      $(this).prepend('<div id="copied_confirmation">Copied to clipboard</div><input type="image" id="copy_to_clipboard" src="/img/guides_copy_button.svg" alt="Copy code block" title="Copy code block"/>');
  });

  $(document).on('click', '#copy_to_clipboard', function (event) {
      event.preventDefault();
      // Target was assigned while hovering over the element to copy.
      target = $(this).siblings('#guide_column codeblock');
      openliberty.copy_element_to_clipboard(target, function () {});
      $(this).prev().fadeIn().delay(500).fadeOut()
  });
  }

  return {
    create: create
  };
})();