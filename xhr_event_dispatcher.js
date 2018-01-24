/**
 * Dispatches three different types of events on the document:
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
 
(_ => {
    const XHR = XMLHttpRequest;

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
