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
var webBrowser = (function(){

  var webBrowserType = function(container, stepName, content) {
    var deferred = new $.Deferred();
    this.stepName = stepName;
    this.contentRootElement = null;
    this.updatedURLCallback = null;    // User-defined callback function
                                       // invoked when the URL is updated

    if (content.url) {
      this.webURL = content.url;
    } else {
      this.webURL = "";
    }

    if (content.browserContent) {
      this.webContent = content.browserContent;
    } else {
      this.webContent = "";
    }
    
    __loadAndCreate(this, container, stepName, content).done(function(result){
      deferred.resolve(result);
    });
    return deferred;
  };

  webBrowserType.prototype = {
    noContentFiller: "<div> NO CONTENT </div>",

    setURL:  function(URLvalue) {
      if (!URLvalue) {
        URLvalue = "";
      }
      this.contentRootElement.find('.wbNavURL').val(URLvalue);
    },
    getURL:  function() {
      return this.contentRootElement.find('.wbNavURL').val();
    },

    setBrowserContent: function(content) {
      var $webContentElement = this.contentRootElement.find('.wbContent');
      var $iframe = $webContentElement.find('iframe');

      if (!content) {
        $iframe.attr('src', "about:blank");
        return;
      }

      var extension = content.substring(content.length - 4).toLowerCase();
      var file =  extension === 'html' || extension === 'htm' ? true: false;
      if (file) {
        var fileLocation = content;
        var $iframe = $webContentElement.find('iframe');
        $iframe.attr('src', fileLocation);

        /* Do we need to try to see if the file is available? 
           We should know 'content' is available as an author of the guide.
           This basically fetches the same data twice....a waste?  
        $(function(){
          $.ajax({
            type: "HEAD",
            async: true,
            url: fileLocation
          })
          .success(function() {
            $iframe.attr('src', fileLocation);
          })
          .error(function() {
            // Handle error ... show 404 or 500 message?
          })
        });  */
      } else {
        $iframe.attr('src', "about:blank");
      }
    },
    getIframeDOM: function() {
      var $iframe = this.contentRootElement.find('.wbContent').find('iframe');
      var iFrameDOM = $iframe.contents();
      return iFrameDOM;
    },

    simulateBrowserRefresh: function() {
      if (this.updatedURLCallback) {
        this.updatedURLCallback(this.getURL());
      } else {   // This webBrowser does not support URL changes.  Redisplay current HTML.
        this.setURL(this.webURL);
        this.setBrowserContent(this.webContent);
      }      
    },

    getStepName: function() {
      return this.stepName;
    },

    // Registers a callback method with this webBrowser
    // instance.  It will be invoked when the URL is updated
    // or the Refresh button is selected and will receive the 
    // navbar URL value as a parameter.  The function can 
    // then identify the browser contents associated with the
    // URL value.
    addUpdatedURLListener: function(callback) {
       this.updatedURLCallback = callback;
    },

    setURLFocus: function() {
      this.contentRootElement.find('.wbNavURL').focus();
    },

    enableRefreshButton: function(enable) {
      if (enable === true) {
          this.contentRootElement.find('.wbRefreshButton').prop('disabled', false);
      } else {
          this.contentRootElement.find('.wbRefreshButton').prop('disabled', true);
      } 
    }

  };


  var __loadAndCreate = function(thisWebBrowser, container, stepName, content) {
      var deferred = new $.Deferred();
      $.ajax({
        context: thisWebBrowser,
        url: "/guides/iguides-common/html/interactive-guides/web-browser.html",
        async: true,
        cache: true,
        success: function(result) {
          container.append($(result));
          thisWebBrowser.contentRootElement = container.find('.wb');
          var $wbNavURL = thisWebBrowser.contentRootElement.find('.wbNavURL');
          var $wbContent = thisWebBrowser.contentRootElement.find('.wbContent');

          // set aria labels
          thisWebBrowser.contentRootElement.attr('aria-label', messages.browserSample);
          $wbNavURL.attr('aria-label', messages.browserAddressBar);
          $wbContent.attr('aria-label', messages.browserContentIdentifier);
          thisWebBrowser.contentRootElement.find('.wbRefreshButton').attr('aria-label', messages.browserRefreshButton);
          thisWebBrowser.contentRootElement.find('.wbRefreshButton').attr('title', messages.browserRefreshButton);

          // Select URL text when in focus
          $wbNavURL.focus(function() {
              $(this).select();
          });

          if (content.callback) {
            var callback = eval(content.callback);
            // Identify this webBrowser with the updatedURLCallback
            // function specified by the user.
            callback(thisWebBrowser);
          }

          __addBrowserListeners(thisWebBrowser);

          // fill in contents
          thisWebBrowser.setURL(thisWebBrowser.webURL);        
          thisWebBrowser.setBrowserContent(thisWebBrowser.webContent);
          deferred.resolve(thisWebBrowser);
        },
        error: function(result) {
          console.error("Could not load web-browser.html");
          deferred.resolve(thisWebBrowser);
        }
      });
      return deferred;
  };

  var __addBrowserListeners = function(thisWebBrowser) {
    var urlField = thisWebBrowser.contentRootElement.find('.wbNavURL');
    urlField.on("keydown", function(event) {
      if (event.which === 13) {  // Enter key
        if (thisWebBrowser.updatedURLCallback) {
          thisWebBrowser.updatedURLCallback(thisWebBrowser.getURL());
        }  else {
          // else, reset to original.  This webBrowser instance does
          // not support URL changes.
          thisWebBrowser.setURL(thisWebBrowser.webURL);
          thisWebBrowser.setBrowserContent(thisWebBrowser.webContent);
        }
      }
    });

    var refreshButton = thisWebBrowser.contentRootElement.find('.wbRefreshButton');
    if (thisWebBrowser.updatedURLCallback) {
      refreshButton.on("click", function(event) {
        event.stopPropagation();
        thisWebBrowser.updatedURLCallback(thisWebBrowser.getURL());
      });
    } else {   // This webBrowser does not support URL changes.  Redisplay current HTML.
      //console.log(thisWebBrowser.webURL);
      //console.log(thisWebBrowser.webContent);
      refreshButton.on("click", function(event) {
        thisWebBrowser.setURL(thisWebBrowser.webURL);
        thisWebBrowser.setBrowserContent(thisWebBrowser.webContent);
      });
    }
  };

  var __create = function(container, stepName, content) {
    return new webBrowserType(container, stepName, content);
  };

  return {
    create: __create
  };
})();
