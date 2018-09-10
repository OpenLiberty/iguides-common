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
var currentView;
var widgetDivs;
function init() {
    widgetDivs = $('.stepWidgetContainer');
    if (window.innerWidth <= 1170) {
        currentView = 'single';
    } else {
        currentView = 'multi';
    }
}

//TODO: functions for getting (and setting) single/multi pane var?
//      to be used in other areas of multipane code

$(window).on('load', function() {
    init();

    //TODO: when switching to multi, determine what step is selected 
    // and show correct widgets (iguides-common PR #185)
    $(window).on('resize', function() {
        if (currentView == 'multi' && window.innerWidth <= 1170) {
            // move widgets to single column
            currentView = 'single';
            console.log('Switch to single column at ', window.innerWidth);

            // JQuery's detach() method returns a NodeList which is tricky to iterate over
            var widgetDivsArray = [].slice.call( widgetDivs.detach() );
            widgetDivsArray.map(function(widget) {
                var step = widget.dataset.step;
                var contentStepDiv = $('#contentContainer #' + step + '_content')[0];
                contentStepDiv.appendChild(widget);
            });
        } else if (currentView == 'single' && window.innerWidth > 1170) {
            // move widgets to right column
            currentView = 'multi';
            console.log('Switch to multi column at ', window.innerWidth);

            var widgetDivsArray = [].slice.call( widgetDivs.detach() );
            var codeColumnDiv = $('#code_column')[0];
            widgetDivsArray.map(function(widget) {
                codeColumnDiv.appendChild(widget);
            });
        } else {
            //Do nothing
        }
    });
});
