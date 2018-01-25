/** This file may be included in userscripts automatically using the following directives:
 *  @grant    unsafeWindow
 *  @require  https://raw.githubusercontent.com/Tiny-Giant/JS-Examples/master/open_event_dispatcher.js
 *  @run-at   document-start
 *  Note: The run-at directive is required if you want to listen to page scripts.
 *        This also requires that you put the rest of the userscript in a DOMContentLoaded event listener
 **/

/** Dispatches four different types of events on the document:
 *  - open_start:
 *     trigger: any call to window.open
 *     data: { window, args }
 *  - open_call:
 *     trigger: any call to any method on any opened window (in the current window)
 *     data: { window, method, args, result }
 *  - open_get:
 *     trigger: any get on any property on any opened window (in the current window)
 *     data: { window, property, value }
 *  - open_set:
 *     trigger: any set on any property on any opened window (in the current window)
 *     data: { window, property, value }
 **/

/** Use the following lines to log all events:
 *    document.addEventListener('open_start', ({ data }) => console.log({ type: 'open_start', data }), false);
 *    document.addEventListener('open_call' , ({ data }) => console.log({ type: 'open_call' , data }), false);
 *    document.addEventListener('open_get'  , ({ data }) => console.log({ type: 'open_get'  , data }), false);
 *    document.addEventListener('open_set'  , ({ data }) => console.log({ type: 'open_set'  , data }), false);
 **/
 
 (_ => {
    const win = 'unsafeWindow' in window ? window.unsafeWindow : window;
    const open = win.open;

    if(win.openCaptured) return false;
    win.openCaptured = true;

    const dispatchOpenEvent = ({ type, data }) => document.dispatchEvent(new MessageEvent(type, { data }));

    win.open = (...args) => {
        const win_result = _open(...args);
        dispatchOpenEvent({ type: 'open_start', data: { window: win_result, args }  });
        return new Proxy(win_result, {
            get: (t, property) => {
                if(typeof win_result[property] === 'function') {
                    return new Proxy(win_result[property], {
                        apply: (t, self, args) => {
                            const result = win_result[property](...args);
                            dispatchOpenEvent({ type: 'open_call', data: { window: win_result, method: property, args: args, result } });
                            return result;
                        }
                    });
                }

                dispatchOpenEvent({ type: 'open_get', data: { window: win_result, property, value: win_result[property] } });
                return win_result[property];
            },
            set: (target, property, value) => {
                dispatchOpenEvent({ type: 'open_set', data: { window: win_result, property, value } });
                win_result[property] = value;
                return true;
            }
        });
    };
})();
