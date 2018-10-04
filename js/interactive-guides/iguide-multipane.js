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
var iguideMultipane = (function() {
    "use strict";

    var currentView;  // value is "single" or "multi"
    var widgetDivs, codeColumnDiv;

    var initView = function() {
        widgetDivs = $('.stepWidgetContainer');
        codeColumnDiv = $('#code_column');
    
        if (inSingleColumnView()) {
            currentView = 'single';
            multiToSingleColumn();
        } else {
            currentView = 'multi';
        }
    };

    var getCurrentViewType = function() {
        return currentView;
    };
    
    var multiToSingleColumn =  function() {
        currentView = 'single';
    
        // JQuery's detach() method returns a NodeList which is tricky to iterate over
        var widgetDivsArray = [].slice.call( widgetDivs.detach() );
        widgetDivsArray.map(function(widget) {
            var step = widget.dataset.step;
            var contentStepDiv = $('#contentContainer #' + step + '_content');
    
            var subsection = contentStepDiv.find('.sect2');
            if (subsection.length > 0) {
                subsection.before(widget);
            } else {
                contentStepDiv.append(widget);
            }
        });
    };
    
    var singleToMultiColumn = function() {
        currentView = 'multi';
    
        var widgetDivsArray = [].slice.call( widgetDivs.detach() );
        widgetDivsArray.map(function(widget) {
            codeColumnDiv.append(widget);
        });
    };

    return {
        initView: initView,
        getCurrentViewType: getCurrentViewType,
        multiToSingleColumn: multiToSingleColumn,
        singleToMultiColumn: singleToMultiColumn
      };
})();


$(document).ready(function() {

    $(window).on('resize', function() {
        var currentView = iguideMultipane.getCurrentViewType();
        if (currentView == 'multi' && inSingleColumnView()) {
            iguideMultipane.multiToSingleColumn();
        } else if (currentView == 'single' && !inSingleColumnView()) {
            iguideMultipane.singleToMultiColumn();
        }
    });
});
