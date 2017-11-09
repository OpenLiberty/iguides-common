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
        /**
         * This widget forms a tabbed editor.  It contains an arraay of fileEditor widgets as the editorList element
         * of its content. 
         * 
         * To Create Example JSON:  
         *         {
         *             "name": "MyStep",
         *             "title": Test Step",
         *             "description": [
         *                 "Trying out tabbed editor."
         *             ],
         *             "content": [
         *                 {
         *                     "displayType": "tabbedEditor",
         *                     "editorList": [
         *                         {
         *                             "displayType": "fileEditor",
         *                             "fileName": "server.xml",
         *                             "preload": [
         *                               "<?xml version=\"1.0\"?>",
         *                               "<server description=\"Sample Liberty server\">",
         *                               "   <featureManager>",
         *                               "      <feature>cdi-1.2</feature>",
         *                               "   </featureManager>",
         *                               "</server>"
         *                             ],
         *                             "save": true
         *                         },
         *                         {
         *                             "displayType":"fileEditor",
         *                             "fileName": "BankService.txt",
         *                             "preload": [
         *                                 "Just some junk on the Bank Service."
         *                             ],
         *                             "save": true
         *                         }
         *                     ]
         *                 }
         * 
         */
        var deferred = new $.Deferred();

        this.stepName = stepName;
        this.editorList = {};           // Tracks editor widget objects by tab id

        __loadAndCreate(this, container, stepName, content).done(function(result){
            deferred.resolve(result);
        });
        return deferred;
    };
    
    tabbedEditorType.prototype = {

        /**
         * Adds a new editor to the END of the TabbedEditor.
         * 
         * @param {} editorInfo - object to create a FileEditor widget. 
         */
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
            editor.create($tabContent, this.stepName, editorInfo).done(function(newEditor) {
                // Remove the editor's file name that appears above a single editor
                $tabContent.find('.editorFileName').parent().remove();
                thisTabbedEditor.editorList[editorName] = newEditor;
            });
        },

        /**
         * Tabs are created as part of a list such as...
         *          <ul>
         *              <li><a>File.name</a></li>
         *              <li><a>File2.name</a></li>
         *          </ul>
         * 
         * This method returns the JQuery object representing the <a> tag
         * associated with the tab for the provided fileName.
         * 
         * @param {String} fileName of an editor within the TabbedEditor
         * @returns {} JQuery object representing the <a> tag of the tab
         */
        findEditorTabByFileName: function(fileName) {
            var tabList = this.$teTabList.find('li');
            var tab = undefined;
            for (var i=0; i<tabList.length; i++) {
                if (tabList[i].textContent === fileName) {
                    tab = $(tabList[i]).find('a');
                    break;
                }
            }
            return tab;   // JQuery object of the 'a' element of the tab || undefined
        },

        /**
         * Tabs are created as part of a list such as...
         *          <ul>
         *              <li><a href='#tab1'>File.name</a></li>
         *              <li><a href='#tab2'>File2.name</a></li>
         *          </ul>
         * 
         * The href associated with each <a> tag has a corresponding
         * <div> tag with the same id as the href. 
         *          <div id='tab'> Tab Editor Contents </div>
         * 
         * This method returns this id value.   
         * 
         * NOTE: Each tabbed-editor object has a editorList object whose
         * members are these id values and their values are a pointer
         * to the FileEditor widget object. 
         * 
         * @param {String} fileName of an editor within the TabbedEditor
         * @returns {String} id value of the tab associated with the 
         *          provided filename or undefined.
         */
        getEditorTabIdByFileName: function(fileName) {
            var tab = this.findEditorTabByFileName(fileName);
            if (tab) {      // Tab is the JQuery object of the 'a' element of the tab
                return (tab[0].hash.substring(1));  // Remove '#' char in front to just return the ID
            }
            return undefined;
        },

        /**
         * Returns the FileEditor widget object for the specified 
         * file name within this tabbed editor.
         * 
         * @param {String} fileName
         * @returns {} FileEditor object associated with provided fileName
         */
        getEditorByFileName: function(fileName) {
            var id = this.getEditorTabIdByFileName(fileName);
            if (id) {
                return this.editorList[id];
            }
            return undefined;
        },

        /**
         * Issues a click event for the tab associated with the specified
         * fileName to bring it into focus.
         * 
         * @param {String} fileName of an editor within the TabbedEditor
         */
        focusTabByFileName: function(fileName) {
            var tab = this.findEditorTabByFileName(fileName);
            if (tab) {
                tab.click();
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
            var editors = content.editorList || [];
            if (editors.length > 0) {
                for (var i=0; i<editors.length; i++) {
                    var tEditor = editors[i];
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