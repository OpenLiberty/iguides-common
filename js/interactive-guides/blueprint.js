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
      
          //TODO: do some smart checking to make sure it's Github link, and append paths better
          var repo = jsonGuide.getGithubRepo(blueprintName);
          if (repo) {
            var repoIssues = repo + "/issues";
            var repoPR = repo + "/pulls";
        
            var contributeStep = {
              "name": "Contribute",
              "title": "Contribute to this guide",
              "description": [ "Is something missing or needs to be fixed? Raise an <a target='_blank' href='" + repoIssues + "'>issue</a>, or send us a <a target='_blank' href='" + repoPR + "'>pull request</a>.",
                                "<br><a target='_blank' href='" + repo + "'>View this guide on github.</a>"]
            };
            steps.push(contributeStep);

            var relateGuides = $("#related-guides");
            if (relateGuides.length > 0) {
              var relateGuidesStep = {
                "name": "RelateGuides",
                "title": "Relate Guides",
                "description": ["<div id=\"relateGuidesContent\"/>"]
              };
              steps.push(relateGuidesStep);
            }          
          }
     
          // Hide the #blueprint_title as it is not used in the interactive guides
          $(ID.blueprintTitle).hide();      
          
          stepContent.setSteps(steps);
          var toc_title = jsonGuide.getGuideDisplayTitle(blueprintName);
          tableofcontents.create(toc_title, steps);        
      
          if (window.location.hash === "") {
            // No step specified in the URL, so display the first page.
            stepContent.createContents(steps[0], false);
          } else {    
            // The URL fragment indentifier (first hash (#) after the URL) indicates
            // the user requested a specific page within the guide.  Go to it.
            var hashValue = window.location.hash.substring(1);  // get rid of '#'
            stepContent.createContentsFromHash(hashValue);
          }

          //On click listener functions for Previous and Next buttons
          $(ID.prevButton).on('click', function(){
            var prevStepName = tableofcontents.prevStepFromName(stepContent.getCurrentStepName());
            stepContent.updateURLfromStepName(prevStepName);
            // Updating the hash in the URL will kick off the window.onhashchange
            // event which will update the page contents.  See window.onhashchange below.
          });
      
          $(ID.nextButton).on('click', function(){
            var nextStepName = tableofcontents.nextStepFromName(stepContent.getCurrentStepName());
            stepContent.updateURLfromStepName(nextStepName);
            // Updating the hash in the URL will kick off the window.onhashchange
            // event which will update the page contents.  See window.onhashchange below.
          });

          // Monitor for hash changes to show the requested page.
          // Hash changes occur when the URL is updated with a new hash
          // value (as in someone bookmarked one of the pages), when a new
          // page is selected from the table of contents, or when the next
          // or previous buttons are selected.
          window.onhashchange = function() {
            var hashValue = window.location.hash.substring(1);  // get rid of '#'
            stepContent.createContentsFromHash(hashValue);
          };
      
          //adding aria-labels to previous/next buttons and using messages file for button text
          $(ID.navButtons).attr('aria-label', messages.navigationButtons);
          $(ID.prevButton).attr('aria-label', messages.prevButton);
          $(ID.prevButton).append(messages.prevButton);
          $(ID.nextButton).attr('aria-label', messages.nextButton);
          $(ID.nextButton).prepend(messages.nextButton);
      
          // Todo move these
          var guideName = jsonGuide.getGuideDisplayTitle(blueprintName);
          $(ID.tableOfContentsTitle).text(guideName);
      
          calculateBackgroundContainer();    
      
          $(window).resize(function(){
            calculateBackgroundContainer();
          });
    });    
  };

  calculateBackgroundContainer = function(){
    // Calculate the bottom of the table of contents
    var tocParent = $("#toc_container").parent();
    var backgroundMargin = parseInt($("#background_container").css('margin-top')) + parseInt($("#background_container").css('margin-bottom'));
    var backgroundPadding = parseInt($("#background_container").css('padding-top')) + parseInt($("#background_container").css('padding-bottom'));
    var minHeight = tocParent.offset().top + tocParent.height() + backgroundMargin + backgroundPadding;

    // Extend the background container's min-height to cover the table of contents
    $("#background_container").css('min-height', minHeight);
    $("#background_container").css('background-size', "100% calc(100% - 50px)");
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
        console.error("Could not load the edittor.html");
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
  }

  return {
    create: create
  };
})();

