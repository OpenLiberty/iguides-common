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
                setTabbedEditorPosition(contentStepDiv.find('.stepWidgetContainer[data-step="' + step + '"]'), step);
                adjustBrowserHeight(contentStepDiv.find('#' + step + '-webBrowser-0'));
                adjustTabbedEditorHeight(contentStepDiv.find('#' + step + '-tabbedEditor-0'));
                adjustPodHeight(contentStepDiv.find('#' + step + '-pod-0'));
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
            setTabbedEditorPosition(widget, step);
            var podHeight = adjustPodHeight(widget.find('#' + step + '-pod-0'));
            var BrowserHeight = adjustBrowserHeight(widget.find('#' + step + '-webBrowser-0'), widget.children().length);
            adjustTabbedEditorHeight(widget.find('#' + step + '-tabbedEditor-0'), podHeight + BrowserHeight);
        });
    };

    var setTabbedEditorPosition = function (stepWidgetContainer, step) {
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

    var adjustPodHeight = function (pod) {
        var height = 150;
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

    var adjustBrowserHeight = function (browser, numOfWidgets) {
        var height = 300;
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
                    height = 200;
                }               
            }
            browser.css('height', height + 'px');
        } else {
            height = 0;
        }
        return height;
    };

    var adjustTabbedEditorHeight = function (tabbedEditor, otherWidgetHeight) {
        if (tabbedEditor.length > 0) {
            if (currentView === 'single') {
                tabbedEditor.css('height', 'auto');
            } else {
                // not able to use $('#code_column').height() as it may get 0 during resizing
                var codeColumnHeight = window.innerHeight - 101; // not able to use $('.navbar').height() as the navbar height changes
                var tabbedEditorHeight = codeColumnHeight - otherWidgetHeight;
                console.log("code_height = " + codeColumnHeight + "; tabbedEditorHeight = " + tabbedEditorHeight);
                tabbedEditor.css('height', tabbedEditorHeight + 'px');
            }
        }
    };

    return {
        initView: initView,
        getCurrentViewType: getCurrentViewType,
        multiToSingleColumn: multiToSingleColumn,
        singleToMultiColumn: singleToMultiColumn
    };
})();


$(document).ready(function () {

    $(window).on('resize', function () {
        var currentView = iguideMultipane.getCurrentViewType();
        if (currentView == 'multi' && inSingleColumnView()) {
            iguideMultipane.multiToSingleColumn();
        } else if (currentView == 'single' && !inSingleColumnView()) {
            iguideMultipane.singleToMultiColumn();
        }
    });
});
