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
          }
          
          stepContent.setSteps(steps);
          var toc_title = jsonGuide.getGuideDisplayTitle(blueprintName);
          tableofcontents.create(toc_title, steps);
      
          tableofcontents.selectStep(steps[0].name);
          stepContent.createContents(steps[0]);
      
          //On click listener functions for Previous and Next buttons
          $(ID.prevButton).on('click', function(){
            var prevStep = tableofcontents.prevStepFromName(stepContent.getCurrentStepName());
            stepContent.createContents(prevStep);
            tableofcontents.scrollToContent();
          });
      
          $(ID.nextButton).on('click', function(){
            var nextStep = tableofcontents.nextStepFromName(stepContent.getCurrentStepName());
            stepContent.createContents(nextStep);
            tableofcontents.scrollToContent();
          });
      
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

