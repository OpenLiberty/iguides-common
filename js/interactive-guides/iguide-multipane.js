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
var widgetDivs, codeColumnDiv;
function init() {
    widgetDivs = $('.stepWidgetContainer');
    codeColumnDiv = $('#code_column')[0];

    if (inSingleColumnView()) {
        currentView = 'single';
    } else {
        currentView = 'multi';
    }
}

function multiToSingleColumn() {
    currentView = 'single';

    // JQuery's detach() method returns a NodeList which is tricky to iterate over
    var widgetDivsArray = [].slice.call( widgetDivs.detach() );
    widgetDivsArray.map(function(widget) {
        var step = widget.dataset.step;
        var contentStepDiv = $('#contentContainer #' + step + '_content')[0];
        contentStepDiv.appendChild(widget);
    });
}

function singleToMultiColumn() {
    currentView = 'multi';

    var widgetDivsArray = [].slice.call( widgetDivs.detach() );
    widgetDivsArray.map(function(widget) {
        codeColumnDiv.appendChild(widget);
    });
}

$(window).on('load', function() {
    init();

    //TODO: when switching to multi, determine what step is selected 
    // and show correct widgets (iguides-common PR #185)
    $(window).on('resize', function() {
        if (currentView == 'multi' && inSingleColumnView()) {
            multiToSingleColumn();
        } else if (currentView == 'single' && !inSingleColumnView()) {
            singleToMultiColumn();
        }
    });
});
