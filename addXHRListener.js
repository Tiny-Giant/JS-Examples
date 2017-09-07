/**
 * @typedef XHRListener
 * @type {function}
 * @param {object} data - Object containing the request object, the property being accessed or method being called, and the value that would be returned
 * @param {XMLHttpRequest} data.xhr - The request object
 * @param {string} [data.property] - The property being accessed (get/set)
 * @param {string} [data.method] - the method being called (call)
 * @param {*} data.value - The value being returned or set (get/set/call)
 * @returns {undefined}
 */
/**
 * @typedef XHRListenerObject
 * @type {object}
 * @param {RegExp} regex - To be matched against XMLHttpRequest.responseURL in order to execute the listener
 * @param {XHRListener} [get] - Called when get operations occur on the request object, 
 * @param {XHRListener} [set] - Called when set operations occur on the request object
 * @param {XHRListener} [call] - Called when methods of the request object are called
 */
/**
 * @function addXHRListener - Intercepts XMLHttpRequests 
 * @param {XHRListenerObject} listener
 * @return {bool} false
 */
/* For de bug porpoises */
/*addXHRListener({
    regex: /./,
    get: data => console.log(data.xhr.responseURL, 'get', data),
    set: data => console.log(data.xhr.responseURL, 'set', data),
    call: data => console.log(data.xhr.responseURL, 'call', data)
});*/
const addXHRListener = (_ => {
    const XHR = XMLHttpRequest;

    const listeners = [];

    unsafeWindow.XMLHttpRequest = new Proxy(XHR, {
        construct: (target, args) => {
            const callall = (type, data) => (listeners.forEach(e => type in e && e.regex.test(xhr.responseURL) && e[type](data)), data);

            const xhr = new XHR();

            return new Proxy(xhr, {
                get: (t, k) => {
                    if(typeof xhr[k] === 'function') {
                        return new Proxy(xhr[k], {
                            apply: async (target, self, args) => {
                                const result = await xhr[k](...args);
                                const data = callall('call', { xhr, 'method': k, 'args': args.join(', '), 'value': result });
                                return data.value;
                            }
                        });
                    }
                    const data = callall('get', { xhr, 'property': k, 'value': xhr[k] });
                    return data.value;
                },
                set: (t, k, v) => {
                    const data = callall('set', { xhr, 'property': k, 'value': v });
                    xhr[k] = data.value;
                    return true;
                }
            });
        }
    });

    return listener => (listeners.push(listener), !0); 
})();
