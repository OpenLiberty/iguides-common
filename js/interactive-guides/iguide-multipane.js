/*******************************************************************************
 * Copyright (c) 2018 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation
 *******************************************************************************/
var iguideMultipane = (function () {
    "use strict";

    var currentView;  // value is "single" or "multi"
    var widgetDivs, codeColumnDiv;

    var initView = function () {
        widgetDivs = $('.stepWidgetContainer');
        codeColumnDiv = $('#code_column');

        if (inSingleColumnView()) {
            currentView = 'single';
            multiToSingleColumn();
        } else {
            currentView = 'multi';
        }
    };

    var getCurrentViewType = function () {
        return currentView;
    };

    var multiToSingleColumn = function () {
        currentView = 'single';

        // JQuery's detach() method returns a NodeList which is tricky to iterate over
        var widgetDivsArray = [].slice.call(widgetDivs.detach());
        widgetDivsArray.map(function (widget) {
            var step = widget.dataset.step;
            var contentStepDiv = $('#contentContainer #' + step + '_content');

            var subsection = contentStepDiv.find('.sect2');
            if (subsection.length > 0) {
                subsection.before(widget);
            } else {
                contentStepDiv.append(widget);

                var stepWidgetContainer = contentStepDiv.find('.stepWidgetContainer[data-step="' + step + '"]');
                _adjustBrowserHeight(contentStepDiv.find('#' + step + '-webBrowser-0'));
                _adjustTabbedEditorHeight(contentStepDiv.find('#' + step + '-tabbedEditor-0'));
                _adjustPodHeight(contentStepDiv.find('#' + step + '-pod-0'));
                _adjustWidgetOrdering(stepWidgetContainer);
            }
        });
    };

    var singleToMultiColumn = function () {
        currentView = 'multi';

        var widgetDivsArray = [].slice.call(widgetDivs.detach());
        widgetDivsArray.map(function (widget) {
            codeColumnDiv.append(widget);

            // adjust the editpr position and height of the widgets in the code_column
            widget = $(widget);
            var step = widget.attr('data-step');
            _adjustPodHeight(widget.find('#' + step + '-pod-0'));
            _adjustBrowserHeight(widget.find('#' + step + '-webBrowser-0'), widget.children().length);
            _adjustWidgetOrdering(widget);
            _resizeActiveWidget(widget);
        });
    };

    var _getConfigWidgetHeight = function(widgetType, isSingleColumnHeight) {
        var widgetHeights = stepContent.getConfigWidgetHeights();
        var multiColumnHeights = widgetHeights['multiColumnHeights'];
        var singleColumnHeights = widgetHeights['singleColumnHeights'];
        var height = widgetHeights['multiColumnHeights'][widgetType];
        // return the single column height if requested and available
        if (isSingleColumnHeight && singleColumnHeights[widgetType]) {
            height = widgetHeights['singleColumnHeights'][widgetType];
        }
        if (height.indexOf('px') !== -1) { 
            height = height.substring(0, height.indexOf('px'));
        }
        height = parseInt(height);
        return height;
    }

    var _adjustPodHeight = function (pod) {
        var height = _getConfigWidgetHeight('pod');
        if (pod.length > 0) {
            if (currentView === 'single') {
                pod.css('height', 'auto');
            } else {
                pod.css('height', height + 'px');
            }
        } else {
            height = 0;
        }
        return height;
    };

    var _adjustBrowserHeight = function (browser, numOfWidgets) {
        var height = _getConfigWidgetHeight('webBrowser');
        if (browser.length > 0) {
            if (currentView === 'single') {
                height = _getConfigWidgetHeight('webBrowser', true);
            } else {
                if (browser.hasClass('disableContainer') && (numOfWidgets > 2)) {
                    height = height - 100;
                }
            }
            browser.css('height', height + 'px');
        } else {
            height = 0;
        }
        return height;
    };

    var _adjustTabbedEditorHeight = function (tabbedEditor, otherWidgetHeight) {
        if (tabbedEditor.length > 0) {
            if (currentView === 'single') {
                if (!tabbedEditor.hasClass('disableContainer')) {
                    // in single view set fix height 
                    var tabbedEditorHeight = _getConfigWidgetHeight('tabbedEditor');
                    tabbedEditor.css('height', tabbedEditorHeight + 'px');
                }
            } else {
                // not able to use $('#code_column').height() as it may get 0 during resizing
                var codeColumnHeight = stepContent.getCodeColumnHeight();
                var tabbedEditorHeight = codeColumnHeight - otherWidgetHeight;
                tabbedEditor.css('height', tabbedEditorHeight + 'px');
            }
        }
    };

    var _adjustWidgetOrdering = function(stepWidgetContainer) {
        var widgets = stepWidgetContainer.find('.subContainerDiv');
        if (widgets.length > 0) {
            // flag to determine whether to move the editor as the first editor by default
            var isSingleColumnOrderSet = false;

            var stepName = stepWidgetContainer.attr('data-step');
            var browser = stepWidgetContainer.find('#' + stepName + '-webBrowser-0');
            var pod = stepWidgetContainer.find('#' + stepName + '-pod-0');
            var editor = stepWidgetContainer.find('#' + stepName + '-tabbedEditor-0');

            var stepWidgetsInfo = stepContent.getStepWidgets(stepName);
            var orderingWidgets = [];

            // figuring out the order of the widgets
            for (var i = 0; i < stepWidgetsInfo.length; i++) {
                if (inSingleColumnView()) {
                    var order = stepWidgetsInfo[i].singleColumnOrder;
                    if (order && $.isNumeric(order) && parseInt(order)) {
                        orderingWidgets[parseInt(order)] = stepWidgetsInfo[i].displayType;
                        isSingleColumnOrderSet = true;
                    } else {
                        orderingWidgets[i] = stepWidgetsInfo[i].displayType;
                    }
                } else {
                    orderingWidgets[i] = stepWidgetsInfo[i].displayType;
                }
            }

            // put the widgets in the order determined
            for (var i = 0; i < orderingWidgets.length; i++){
                if (orderingWidgets[i] === "webBrowser") {
                    browser.detach();
                    stepWidgetContainer.append(browser);
                } else if (orderingWidgets[i] === "pod") {
                    pod.detach();
                    stepWidgetContainer.append(pod);
                } else if (orderingWidgets[i] === "tabbedEditor") {
                    editor.detach();
                    stepWidgetContainer.append(editor);
                }
            }

            if (inSingleColumnView() && !isSingleColumnOrderSet) {
                // if no single column ordering is set, then move the editor as the first widget
                editor.detach();
                stepWidgetContainer.prepend(editor);
            }
        }
    };

    var resizeCodeColumnHeightInStepShown = function() {
        var stepContainer = $('.stepWidgetContainer.multicolStepShown');
        if (stepContainer.length > 0) {
            _resizeActiveWidget(stepContainer);
        }
    };

    var _resizeActiveWidget = function(containerWidget) {
        var stepName = containerWidget.attr('data-step');
        var webBrowserWidget = containerWidget.find('#' + stepName + '-webBrowser-0');
        var editorWidget = containerWidget.find("#" + stepName + "-tabbedEditor-0");
        var activeWidgetType = "pod";
        if (webBrowserWidget.hasClass('activeWidget')) {
            activeWidgetType = "webBrowser";
        } else if (editorWidget.hasClass('activeWidget')) {
            activeWidgetType = "tabbedEditor";
        }
        stepContent.resizeStepWidgets(stepContent.getStepWidgets(stepName), activeWidgetType);
    };

    return {
        initView: initView,
        getCurrentViewType: getCurrentViewType,
        multiToSingleColumn: multiToSingleColumn,
        singleToMultiColumn: singleToMultiColumn,
        resizeCodeColumnHeightInStepShown: resizeCodeColumnHeightInStepShown
    };
})();


$(document).ready(function () {

    $(window).on('resize', function () {
        var currentView = iguideMultipane.getCurrentViewType();
        if (currentView === 'multi' && inSingleColumnView()) {
            iguideMultipane.multiToSingleColumn();
        } else if (currentView === 'single' && !inSingleColumnView()) {
            iguideMultipane.singleToMultiColumn();
        } else if (currentView === 'multi' && !inSingleColumnView()) {
            iguideMultipane.resizeCodeColumnHeightInStepShown();
        }
    });

    $(window).on('scroll', function() {
        if (iguideMultipane.getCurrentViewType() === 'multi') {
            iguideMultipane.resizeCodeColumnHeightInStepShown();
        }
    });
});
