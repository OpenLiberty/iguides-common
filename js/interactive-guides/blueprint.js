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
          stepContent.setSteps(steps);
          tableofcontents.create(steps);
          stepContent.createGuideContents();
      
          // Monitor for hash changes to show the requested page.
          // Hash changes occur when the URL is updated with a new hash
          // value (as in someone bookmarked one of the pages) or when a new
          // page is selected from the table of contents.
          // HashChange event processing also occurs in content\common-multipane.js.
          window.addEventListener("hashchange", function(){
            var id = location.hash.substring(1);
            stepContent.setCurrentStepName(id);
          });

          if (window.location.hash !== "") {   
            // The URL fragment indentifier (first hash (#) after the URL) indicates
            // the user requested a specific page within the guide.  Go to it.
            stepContent.accessContentsFromHash();
          }
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
  }

  return {
    create: create
  };
})();

