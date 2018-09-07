var currentView;
var widgetDivs;
function init() {
    if (document.body.scrollWidth <= 1170) {
        currentView = 'single';
        widgetDivs = $('.stepWidgetContainer');
    } else {
        currentView = 'multi';
        widgetDivs = $('.stepWidgetContainer');
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

            var widgetDivsArray = [].slice.call( widgetDivs.detach() );
            widgetDivsArray.map(widget => {
                var step = widget.dataset.step;
                //alternatively, $("#contentContainer .sect1#" + step + "_content")[0];
                var contentStepDiv = $("#contentContainer .sect1:has(div[data-step='" + step + "'])")[0];
                contentStepDiv.appendChild(widget);
            });
        } else if (currentView == 'single' && window.innerWidth > 1170) {
            // move widgets to right column
            currentView = 'multi';
            console.log('Switch to multi column at ', window.innerWidth);

            var widgetDivsArray = [].slice.call( widgetDivs.detach() );
            widgetDivsArray.map(widget => {
                var step = widget.dataset.step;
                var codeColumnDiv = $("#code_column")[0];
                codeColumnDiv.appendChild(widget);
            });
        } else {
            //Do nothing
        }
    });
});
