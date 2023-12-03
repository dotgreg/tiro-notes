let scrollBarWidth = 15;
let hasBeenCalc = false;
export const   getScrollbarWidth = ()  => {
    if (!hasBeenCalc) {
        // Creating invisible container
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        //@ts-ignore
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
        document.body.appendChild(outer);
    
        // Creating inner element and placing it in the container
        const inner = document.createElement('div');
        outer.appendChild(inner);
    
        // Calculating difference between container's full width and the child width
        scrollBarWidth = (outer.offsetWidth - inner.offsetWidth);
    
        // Removing temporary elements from the DOM
        //@ts-ignore
        outer.parentNode.removeChild(outer);
        hasBeenCalc = true;
        return scrollBarWidth;
    } else {
        // console.log('scrollBarWidth', scrollBarWidth);
        return scrollBarWidth;
    }  
  }