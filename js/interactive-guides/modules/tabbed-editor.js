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
var tabbedEditor = (function() {
    var __editors = [];

    var tabbedEditorType = function(container, stepName, content) {
        var deferred = new $.Deferred();

        this.stepName = stepName;
        this.editorList = content.editorList || [];

        __loadAndCreate(this, container, stepName, content).done(function(result){
            deferred.resolve(result);
        });
        return deferred;
    };
    
    tabbedEditorType.prototype = {

        addEditor: function(editorInfo) {
            // New tabs will be added to the end of the existing tabs
            var numTabs = this.$teTabList.find('a').length;

            // A fileName must be specified for each editor.
            // Editor preload, readonly, save, and callback fields are optional.
            // See editor.js for more information.
            if (!editorInfo.fileName) {
                editorInfo.fileName = "Tab-" + numTabs;
            }

            // Create the dom elements for the new editor
            var editorName = 'teTab-editor' + this.displayTypeNum + '-tab' + numTabs;    // or should this be the filename?
                     
            // Tab....
            var $tabItem = $("<li role='presentation'><a role='tab' href='#" + editorName + "' aria-label='" + editorInfo.fileName + "'>" + editorInfo.fileName + "</a></li>");
            var thisTabbedEditor = this;
            $tabItem.on('click', 'a', function(e){
                // Make the old tab inactive.
                if (thisTabbedEditor.$active) {
                    thisTabbedEditor.$active.removeClass('active');                    
                }
                if (thisTabbedEditor.$content) {
                    thisTabbedEditor.$content.hide();                    
                }
                     
                // Update the variables with the new link and content
                thisTabbedEditor.$active = $(this);
                thisTabbedEditor.$content = $(this.hash);
                     
                // Make the tab active.
                thisTabbedEditor.$active.addClass('active');
                thisTabbedEditor.$content.show();
                     
                // Prevent the anchor's default click action
                e.preventDefault();
            });
            this.$teTabList.append($tabItem);
                     
            // Content.....create hidden
            var $tabContent = $("<div id='" + editorName + "' class='teTabContent'  role='tabpanel'></div>");
            this.$teTabContents.append($tabContent);
            // Add the editor to the div
            editor.create($tabContent, this.stepName, editorInfo);
            // Remove the editor's file name that appears above a single editor
            $tabContent.find('.editorFileName').parent().remove();            
        },

        focusTabByFileName: function(fileName) {
            var tabList = this.$teTabList.find('li');
            var tab = undefined;
            for (var i=0; i<tabList.length; i++) {
                if (tabList[i].textContent === fileName) {
                    tab = tabList[i];
                    break;
                }
            }
            if (tab) {
                $(tab).find('a').click();
            }
        }
    };            

    var __loadAndCreate = function(thisTabbedEditor, container, stepName, content) {
        var deferred = new $.Deferred();
        $.ajax({
          context: thisTabbedEditor,
          url: "/guides/iguides-common/html/interactive-guides/tabbed-editor.html",
          async: true,
          cache: true,
          success: function(result) {
            container.append($(result));

            thisTabbedEditor.tabsRootElement = container.find('.teContainer');
            thisTabbedEditor.tabsRootElement.attr('aria-label', messages.tabbedEditorContainer);
            thisTabbedEditor.$teTabList = thisTabbedEditor.tabsRootElement.find('.teTabs');
            thisTabbedEditor.$teTabContents = thisTabbedEditor.tabsRootElement.find('.teContents');
  
            var containerID = container[0].id;
            thisTabbedEditor.displayTypeNum = containerID.substring(containerID.lastIndexOf('-')+1);

            // Fill in the editors for this Tabbed Editor in different tabs
            if (thisTabbedEditor.editorList.length > 0) {
                for (var i=0; i<thisTabbedEditor.editorList.length; i++) {
                    var tEditor = thisTabbedEditor.editorList[i];
                    thisTabbedEditor.addEditor(tEditor);
                }
                
                // Set the first tab initially active
                thisTabbedEditor.$teTabList.find('a').first().click();

            }

            deferred.resolve(thisTabbedEditor);
          },
          error: function(result) {
            console.error("Could not load tabbed-editor.html");
            deferred.resolve(thisTabbedEditor);
          }
        });
        return deferred;
    };          

    var __create = function(container, stepName, content) {
        return new tabbedEditorType(container, stepName, content);
    };
        
    return {
        create: __create
      };    
})();