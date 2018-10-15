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

                // adjust the editpr position and height of the widgets in the code_column
                _setTabbedEditorPosition(contentStepDiv.find('.stepWidgetContainer[data-step="' + step + '"]'), step);
                _adjustBrowserHeight(contentStepDiv.find('#' + step + '-webBrowser-0'));
                _adjustTabbedEditorHeight(contentStepDiv.find('#' + step + '-tabbedEditor-0'));
                _adjustPodHeight(contentStepDiv.find('#' + step + '-pod-0'));
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
            _setTabbedEditorPosition(widget, step);
            _adjustPodHeight(widget.find('#' + step + '-pod-0'));
            _adjustBrowserHeight(widget.find('#' + step + '-webBrowser-0'), widget.children().length);
            _resizeActiveWidget(widget);
        });
    };

    var _setTabbedEditorPosition = function (stepWidgetContainer, step) {
        if (stepWidgetContainer.length > 0) {
            var tabbedEditorWidget = stepWidgetContainer.find('#' + step + '-tabbedEditor-0');
            if (tabbedEditorWidget.length > 0) {
                if (currentView === 'multi') {
                    tabbedEditorWidget.detach();
                    stepWidgetContainer.append(tabbedEditorWidget);
                } else {
                    tabbedEditorWidget.detach();
                    stepWidgetContainer.prepend(tabbedEditorWidget);
                }
            }
        }
    };

    var _getConfigWidgetHeight = function(widgetType) {
        var height = stepContent.getConfigWidgetHeights()[widgetType];
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
                var balanceContainer = browser.find('.wbContent').find('iframe').contents().find('div.checkBalanceContainer');                
                // One will think that checkBalanceContainer may not be there depending on the step progress.
                // However, neither checkBalanceContainer nor flexWarningContainer selector was returned.
                // As a result the height for browser is always 300 in single column view.
                if (balanceContainer.length > 0) {
                    height = balanceContainer.height() + 126;
                } 
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
                    tabbedEditor.css('height', 'auto');
                }
            } else {
                // not able to use $('#code_column').height() as it may get 0 during resizing
                var codeColumnHeight = window.innerHeight - 101; // not able to use $('.navbar').height() as the navbar height changes
                var tabbedEditorHeight = codeColumnHeight - otherWidgetHeight;
                tabbedEditor.css('height', tabbedEditorHeight + 'px');
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
