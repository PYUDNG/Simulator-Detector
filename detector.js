/* Simulator Detector.js
** Detect Simulated DOM events dispatched by other script
** Usage: 
**     1. insert this script's code in a <script> and place it before <html>, like <!DOCTYPE html><script> ...code... </script><html> ...your document... </html>
**     2. window.simulatorDetector.addEventListener('event', e => console.log(e.detail));
** Events:
**     detect: an simulated DOM event detected.
**     bypass: an script is trying to bypass the detector. In this case, detector may be unable to detect simulated DOM events.
** Note: detector hooks addEventListener function to detect events which are not trusted (e.isTrusted === false). So, use addEventListener insteadof on+event to register your event listeners.
*/
(function() {
	const addEventListener = window.EventTarget.prototype.addEventListener;
	const removeEventListener = window.EventTarget.prototype.removeEventListener;
	const listenerMap = new Map();
	const Resources = {
		CustomEvent,
		Error,
		Element,
		toString: Object.prototype.toString,
		getPrototypeOf: Object.getPrototypeOf,
		defineProperty: Object.defineProperty,
		defineProperties: Object.defineProperties,
		reduce: Array.prototype.reduce,
		forEach: Array.prototype.forEach,
		from: Array.from,
		push: Array.prototype.push,
		querySelectorAll: Element.prototype.querySelectorAll,
		add: Set.prototype.add,
		preventDefault: Event.prototype.preventDefault,
		stopImmediatePropagation: Event.prototype.stopImmediatePropagation,
		set: Map.prototype.set,
		has: Map.prototype.has,
		get: Map.prototype.get,
	}
	Object.defineProperties(Function.prototype, {
		call: {
			value: Function.prototype.call,
			writable: false,
			configurable: false,
			enumerable: true,
		},
		apply: {
			value: Function.prototype.apply,
			writable: false,
			configurable: false,
			enumerable: true,
		}
	})

	// Expose api
	const simulatorDetector = new EventTarget();
	Resources.defineProperty(window, 'simulatorDetector', {
		value: simulatorDetector,
		writable: false,
		configurable: false,
		enumerable: true,
	});
    simulatorDetector.bypassed = false;

	// Hook EventTarget
    try {
        Object.defineProperty(window.EventTarget.prototype, 'addEventListener', {
            get() {
                return function(name, func, options) {
                    const args = [...arguments];
                    if (isElement(this)) {
                        args[1] = listener;
                        Resources.set.call(listenerMap, func, listener);
                        captureDocument(name);
                    }
                    addEventListener.apply(this, args);
            
                    function listener(e) {
                        if (!e.isTrusted) {
                            simulatorDetector.dispatchEvent(new Resources.CustomEvent('detect', { detail: {
                                target: this,
                                event: e,
                                stack: new Resources.Error().stack
                            } }));
                            Resources.preventDefault.call(e);
                            Resources.stopImmediatePropagation.call(e);
                            return false;
                        }
                        func.apply(this, arguments);
                    }
                }
            },
            configurable: false,
            enumerable: true
        });
    } catch(err) {
        simulatorDetector.bypassed = true;
        simulatorDetector.dispatchEvent(new Resources.CustomEvent('bypass', { detail: {
            error: err,
            element: null
        } }));
    }
	window.EventTarget.prototype.removeEventListener = function(name, func, options) {
		const args = [...arguments];
		if (isElement(this) && func && Resources.has.call(listenerMap, func)) {
			args[1] = Resources.get.call(listenerMap, func);
		}
		removeEventListener.apply(this, args);
	}

	// Hook elements
	dealElements();

	// Freeze objects
	[EventTarget.prototype, simulatorDetector].forEach(o => Object.freeze(o));

	function captureDocument(name) {
		const captured = [];
		captureDocument = function(name) {
			if (captured.includes(name)) { return false; }
			addEventListener.call(document, name, listener, { capture: true });
			Resources.push.call(captured, name);
		}
		captureDocument(name);

		function listener(e) {
			if (!e.isTrusted) {
				simulatorDetector.dispatchEvent(new Resources.CustomEvent('detect', { detail: {
					target: e.target,
					event: e,
					stack: new Resources.Error().stack
				} }));
				Resources.preventDefault.call(e);
				Resources.stopImmediatePropagation.call(e);
			}
		}
	}

	function dealElement(element) {
		try {
			Resources.defineProperties(element, {
				addEventListener: {
					value: window.EventTarget.prototype.addEventListener,
					writable: false,
					configurable: false,
					enumerable: false
				},
				removeEventListener: {
					value: window.EventTarget.prototype.removeEventListener,
					writable: false,
					configurable: false,
					enumerable: false
				}
			});
		} catch (err) {
            simulatorDetector.bypassed = true;
			simulatorDetector.dispatchEvent(new Resources.CustomEvent('bypass', { detail: {
				error: err,
				element
			} }));
		}
	}

	function dealElements() {
		for (const elm of document.querySelectorAll('*')) {
			dealElement(elm);
		}

		const observer = new MutationObserver(mCallback);
		observer.observe(document, {
			childList: true,
			subtree: true
		});

		function mCallback(mutationList, observer) {
			const addedNodes = Resources.reduce.call(mutationList, (an, mutation) => ((an.push.apply(an, mutation.addedNodes), an)), []);
			const allAddedElements = Resources.reduce.call(addedNodes, (elements, anode) => {
				if (isElement(anode)) {
					Resources.add.call(elements, anode);
					Resources.forEach.call(Resources.from.call(Array, Resources.querySelectorAll.call(anode, '*')), elm => Resources.add.call(elements, elm));
				}
				return elements;
			}, new Set());
			for (const elm of allAddedElements) {
				dealElement(elm);
			}
		}

		return observer;
	}

	function isElement(target) {
		if (target instanceof Resources.Element) { return true; }
		while(true) {
			if (!target) { return false; }
			const str = Resources.toString.call(target);
			if (str === '[object Element]') { return true; }
			target = Resources.getPrototypeOf(target);
		}
	}
}) ();