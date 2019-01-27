(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@polpware/fe-dependencies'), require('@polpware/fe-utilities')) :
    typeof define === 'function' && define.amd ? define('@polpware/fe-behavior', ['exports', '@polpware/fe-dependencies', '@polpware/fe-utilities'], factory) :
    (factory((global.polpware = global.polpware || {}, global.polpware['fe-behavior'] = {}),global.dependencies,global.feUtilities));
}(this, (function (exports,dependencies,feUtilities) { 'use strict';

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */
    // A set of helper functions
    /** @type {?} */
    var _ = dependencies.underscore;
    /** @type {?} */
    var StateMachine = dependencies.statemachine;
    /** @type {?} */
    var indexOf = _.indexOf;
    /** @type {?} */
    var without = _.without;
    /** @type {?} */
    var transitionKeyFormat = '{from}2{to}';
    /** @type {?} */
    var errorMessageFormat = 'Transition {name} from {from} to {to} fails.';
    /**
     * @param {?} value
     * @return {?}
     */
    function captialize(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    /**
     * Builds a handler with necessary context information.
     * The resulting return value is a closure indeed.
     * @param {?} context
     * @param {?} key
     * @return {?}
     */
    function buildHandlerInClosure(context, key) {
        return function () {
            /** @type {?} */
            var ourHandlers = context[key];
            if (!ourHandlers) {
                return;
            }
            for (var i = 0; i < ourHandlers.length; i++) {
                /** @type {?} */
                var func = ourHandlers[i];
                func.apply(null, arguments);
            }
        };
    }
    /**
     * Default error handler for the FSM.
     * @param {?} eventName
     * @param {?} from
     * @param {?} to
     * @return {?}
     */
    function defaultErrorHandler(eventName, from, to) {
        /** @type {?} */
        var info = feUtilities.replace(errorMessageFormat, {
            name: eventName,
            from: from,
            to: to
        });
        console.log(info);
    }
    /**
     * Represents a finite state machine.
     * The resulting FSM is built upon a commonly used javascript
     * state machine library.
     * Such a design (of architecture) is based on the following considerations:
     * - A user-friendly interface for defining states and their behaviors
     * - A kind of model-checking capability for verifying the correctness of
     * transitions
     * - Support for asychronous and synchrous transitions
     * - Support for global exception handling
     */
    var /**
     * Represents a finite state machine.
     * The resulting FSM is built upon a commonly used javascript
     * state machine library.
     * Such a design (of architecture) is based on the following considerations:
     * - A user-friendly interface for defining states and their behaviors
     * - A kind of model-checking capability for verifying the correctness of
     * transitions
     * - Support for asychronous and synchrous transitions
     * - Support for global exception handling
     */ FiniteStateMachine = /** @class */ (function () {
        function FiniteStateMachine() {
            this._impl = null;
            this._initState = null;
            this._errorHandler = null;
            this._stateConfiguration = {};
            this._transitionConfiguration = {};
            this._handlers = {};
        }
        /**
         * Checks if FSM is in configuration stage.
         */
        /**
         * Checks if FSM is in configuration stage.
         * @private
         * @return {?}
         */
        FiniteStateMachine.prototype.ensureConfigureStage = /**
         * Checks if FSM is in configuration stage.
         * @private
         * @return {?}
         */
            function () {
                if (this._impl) {
                    throw new Error('State machine has started.');
                }
            };
        /**
         * Checks if FSM is in running stage.
         */
        /**
         * Checks if FSM is in running stage.
         * @private
         * @return {?}
         */
        FiniteStateMachine.prototype.ensureRunningStage = /**
         * Checks if FSM is in running stage.
         * @private
         * @return {?}
         */
            function () {
                if (!this._impl) {
                    throw new Error('State machine has not yet started.');
                }
            };
        /**
         * Defines the behavior when the FSM moves into a state by a transition.
         */
        /**
         * Defines the behavior when the FSM moves into a state by a transition.
         * @template THIS
         * @this {THIS}
         * @param {?} name
         * @param {?=} onEnterCallback
         * @param {?=} onLeaveCallback
         * @return {THIS}
         */
        FiniteStateMachine.prototype.addState = /**
         * Defines the behavior when the FSM moves into a state by a transition.
         * @template THIS
         * @this {THIS}
         * @param {?} name
         * @param {?=} onEnterCallback
         * @param {?=} onLeaveCallback
         * @return {THIS}
         */
            function (name, onEnterCallback, onLeaveCallback) {
                // Pre-conditions
                ( /** @type {?} */(this)).ensureConfigureStage();
                /** @type {?} */
                var stateConf = ( /** @type {?} */(this))._stateConfiguration;
                if (stateConf[name]) {
                    throw new Error('Redefined state: ' + name);
                }
                stateConf[name] = {
                    onEnterCallback: onEnterCallback,
                    onLeaveCallback: onLeaveCallback
                };
                return ( /** @type {?} */(this));
            };
        /**
         * Defines the init state for the FSM.
         */
        /**
         * Defines the init state for the FSM.
         * @template THIS
         * @this {THIS}
         * @param {?} name
         * @return {THIS}
         */
        FiniteStateMachine.prototype.setInitState = /**
         * Defines the init state for the FSM.
         * @template THIS
         * @this {THIS}
         * @param {?} name
         * @return {THIS}
         */
            function (name) {
                // Pre-conditions
                ( /** @type {?} */(this)).ensureConfigureStage();
                if (( /** @type {?} */(this))._initState) {
                    throw new Error('Redefined init state: ' + ( /** @type {?} */(this))._initState);
                }
                ( /** @type {?} */(this))._initState = name;
                return ( /** @type {?} */(this));
            };
        /**
         * Defines a new stransition.
         */
        /**
         * Defines a new stransition.
         * @template THIS
         * @this {THIS}
         * @param {?} from
         * @param {?} to
         * @param {?=} onAfterCallback
         * @param {?=} onBeforeCallback
         * @return {THIS}
         */
        FiniteStateMachine.prototype.addTransition = /**
         * Defines a new stransition.
         * @template THIS
         * @this {THIS}
         * @param {?} from
         * @param {?} to
         * @param {?=} onAfterCallback
         * @param {?=} onBeforeCallback
         * @return {THIS}
         */
            function (from, to, onAfterCallback, onBeforeCallback) {
                // Pre-condition
                ( /** @type {?} */(this)).ensureConfigureStage();
                /** @type {?} */
                var stateConf = ( /** @type {?} */(this))._stateConfiguration;
                /** @type {?} */
                var transitionConf = ( /** @type {?} */(this))._transitionConfiguration;
                if (!stateConf[from]) {
                    throw new Error('Undefined source state: ' + from);
                }
                if (!stateConf[to]) {
                    throw new Error('Undefined target state: ' + to);
                }
                /** @type {?} */
                var key = feUtilities.replace(transitionKeyFormat, { from: from, to: to });
                if (transitionConf[key]) {
                    throw new Error('Redefined transition: ' + from + ' -> ' + to);
                }
                transitionConf[key] = {
                    from: from, to: to,
                    onAfterCallback: onAfterCallback,
                    onBeforeCallback: onBeforeCallback
                };
                return ( /** @type {?} */(this));
            };
        /**
         * Starts the FSM. Note that this method must be invoked before
         * any method which may change the state of the FSM.
         */
        /**
         * Starts the FSM. Note that this method must be invoked before
         * any method which may change the state of the FSM.
         * @template THIS
         * @this {THIS}
         * @return {THIS}
         */
        FiniteStateMachine.prototype.start = /**
         * Starts the FSM. Note that this method must be invoked before
         * any method which may change the state of the FSM.
         * @template THIS
         * @this {THIS}
         * @return {THIS}
         */
            function () {
                ( /** @type {?} */(this)).ensureConfigureStage();
                if (!( /** @type {?} */(this))._initState) {
                    throw new Error('Init state has not been defined.');
                }
                // Definition
                /** @type {?} */
                var stateConf = ( /** @type {?} */(this))._stateConfiguration;
                /** @type {?} */
                var transitionConf = ( /** @type {?} */(this))._transitionConfiguration;
                /** @type {?} */
                var transitions = [];
                /** @type {?} */
                var methods = {};
                for (var k1 in transitionConf) {
                    if (transitionConf.hasOwnProperty(k1)) {
                        /** @type {?} */
                        var elem1 = transitionConf[k1];
                        transitions.push({
                            name: k1,
                            from: elem1.from,
                            to: elem1.to
                        });
                        if (elem1.onAfterCallback) {
                            methods['onAfter' + captialize(k1)] = elem1.onAfterCallback;
                        }
                        if (elem1.onBeforeCallback) {
                            methods['onBefore' + captialize(k1)] = elem1.onAfterCallback;
                        }
                    }
                }
                for (var k2 in stateConf) {
                    if (stateConf.hasOwnProperty(k2)) {
                        /** @type {?} */
                        var elem2 = stateConf[k2];
                        if (elem2.onEnterCallback) {
                            methods['onEnter' + captialize(k2)] = elem2.onEnterCallback;
                        }
                        if (elem2.onLeaveCallback) {
                            methods['onLeave' + captialize(k2)] = elem2.onLeaveCallback;
                        }
                    }
                }
                /** @type {?} */
                var handlers = ( /** @type {?} */(this))._handlers;
                handlers.onEnterState = [];
                handlers.onLeaveState = [];
                methods['onEnterState'] = buildHandlerInClosure(( /** @type {?} */(this))._handlers, 'onEnterState');
                methods['onLeaveState'] = buildHandlerInClosure(( /** @type {?} */(this))._handlers, 'onLeaveState');
                ( /** @type {?} */(this))._impl = new StateMachine({
                    init: ( /** @type {?} */(this))._initState,
                    transitions: transitions,
                    methods: methods,
                    onInvalidTransition: ( /** @type {?} */(this))._errorHandler || defaultErrorHandler
                });
                return ( /** @type {?} */(this));
            };
        /**
         * Registers a handler for enterstate
         */
        /**
         * Registers a handler for enterstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
        FiniteStateMachine.prototype.onEnterState = /**
         * Registers a handler for enterstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
            function (handler) {
                /** @type {?} */
                var ourHandlers = ( /** @type {?} */(this))._handlers.onEnterState;
                if (indexOf(ourHandlers, handler) >= 0) {
                    throw new Error('Re-registering a hander!');
                }
                ourHandlers.push(handler);
                return ( /** @type {?} */(this));
            };
        /**
         * Registers a handler for exitstate
         */
        /**
         * Registers a handler for exitstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
        FiniteStateMachine.prototype.onExitState = /**
         * Registers a handler for exitstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
            function (handler) {
                /** @type {?} */
                var ourHandlers = ( /** @type {?} */(this))._handlers.onLeaveState;
                if (indexOf(ourHandlers, handler) >= 0) {
                    throw new Error('Registering a hander!');
                }
                ourHandlers.push(handler);
                return ( /** @type {?} */(this));
            };
        /**
         * Un-register a handler for enterstate
         */
        /**
         * Un-register a handler for enterstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
        FiniteStateMachine.prototype.offEnterState = /**
         * Un-register a handler for enterstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
            function (handler) {
                /** @type {?} */
                var ourHandlers = ( /** @type {?} */(this))._handlers.onEnterState;
                ( /** @type {?} */(this))._handlers.onenterstate = without(ourHandlers, handler);
                return ( /** @type {?} */(this));
            };
        /**
         * Un-register a handler for exitstate
         */
        /**
         * Un-register a handler for exitstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
        FiniteStateMachine.prototype.offExitState = /**
         * Un-register a handler for exitstate
         * @template THIS
         * @this {THIS}
         * @param {?} handler
         * @return {THIS}
         */
            function (handler) {
                /** @type {?} */
                var ourHandlers = ( /** @type {?} */(this))._handlers.onLeaveState;
                ( /** @type {?} */(this))._handlers.onexitstate = without(ourHandlers, handler);
                return ( /** @type {?} */(this));
            };
        /**
         * Performs a transition to the given state.
         * This method also validate the transition.
         */
        /**
         * Performs a transition to the given state.
         * This method also validate the transition.
         * @param {?} to
         * @return {?}
         */
        FiniteStateMachine.prototype.go = /**
         * Performs a transition to the given state.
         * This method also validate the transition.
         * @param {?} to
         * @return {?}
         */
            function (to) {
                this.ensureRunningStage();
                /** @type {?} */
                var stateConf = this._stateConfiguration;
                if (!stateConf[to]) {
                    throw new Error('Go to undefined state: ' + to);
                }
                if (this._impl.is(to)) {
                    // TODO: check if the underlying implementation takes into account
                    // moving from one state to itself
                    return this;
                }
                /** @type {?} */
                var currentState = this._impl.state;
                /** @type {?} */
                var transitionName = feUtilities.replace(transitionKeyFormat, { from: currentState, to: to });
                // Validate if this transition is allowed or not
                if (this._impl.cannot(transitionName)) {
                    throw new Error('Transition is not allowed: ' + currentState + ' -> ' + to);
                }
                // Invoke this function
                /** @type {?} */
                var func = this._impl[transitionName];
                func.call(this._impl);
                return self;
            };
        /**
         * Provides the error handler for the FSM.
         */
        /**
         * Provides the error handler for the FSM.
         * @template THIS
         * @this {THIS}
         * @param {?} fn
         * @return {THIS}
         */
        FiniteStateMachine.prototype.addErrorHandler = /**
         * Provides the error handler for the FSM.
         * @template THIS
         * @this {THIS}
         * @param {?} fn
         * @return {THIS}
         */
            function (fn) {
                ( /** @type {?} */(this)).ensureConfigureStage();
                ( /** @type {?} */(this))._errorHandler = fn;
                return ( /** @type {?} */(this));
            };
        /**
         * Returns the current state.
         */
        /**
         * Returns the current state.
         * @return {?}
         */
        FiniteStateMachine.prototype.current = /**
         * Returns the current state.
         * @return {?}
         */
            function () {
                this.ensureRunningStage();
                return this._impl.state;
            };
        return FiniteStateMachine;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */

    exports.FiniteStateMachine = FiniteStateMachine;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=polpware-fe-behavior.umd.js.map