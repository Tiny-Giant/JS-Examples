/** This file may be included in userscripts automatically using the following directives:
 *  @grant    unsafeWindow
 *  @require  https://raw.githubusercontent.com/Tiny-Giant/JS-Examples/master/xhr_event_dispatcher.js
 *  @run-at   document-start
 *  Note: The run-at directive is required if you want to listen to page scripts.
 *        This also requires that you put the rest of the userscript in a DOMContentLoaded event listener
 **/

/** Dispatches three different types of events on the document:
 *  - xhr_call:
 *     trigger: any call to any method on any xhr object
 *     data: { xhr, method, args, result }
 *  - xhr_get:
 *     trigger: any get on any property on any xhr object
 *     data: { xhr, property, value }
 *  - xhr_set:
 *     trigger: any set on any property on any xhr object
 *     data: { xhr, property, value }
 **/

/** Use the following lines to log all events:
 *    document.addEventListener('xhr_call', ({ data }) => console.log(data), false);
 *    document.addEventListener('xhr_get',  ({ data }) => console.log(data), false);
 *    document.addEventListener('xhr_set',  ({ data }) => console.log(data), false);
 **/
 
(_ => {
    const win = (unsafeWindow || window);
    const XHR = win.XMLHttpRequest;
 
    console.log(win.XHRCaptured);
    if(win.XHRCaptured) return false;
    win.XHRCaptured = true;   

    const dispatchXHREvent = ({ type, data }) => document.dispatchEvent(new MessageEvent(type, { data }));

    (unsafeWindow || window).XMLHttpRequest = new Proxy(XHR, {
        construct: (target, args) => {
            const xhr = new XHR();

            return new Proxy(xhr, {
                get: (t, property) => {
                    if(typeof xhr[property] === 'function') {
                        return new Proxy(xhr[property], {
                            apply: (t, self, args) => {
                                const result = xhr[property](...args);
                                dispatchXHREvent({ type: 'xhr_call', data: { xhr, method: property, args: args, result } });
                                return result;
                            }
                        });
                    }

                    dispatchXHREvent({ type: 'xhr_get', data: { xhr, property, value: xhr[property] } });
                    return xhr[property];
                },
                set: (target, property, value) => {
                    dispatchXHREvent({ type: 'xhr_set', data: { xhr, property, value } });
                    xhr[property] = value;
                    return true;
                }
            });
        }
    });
})();
