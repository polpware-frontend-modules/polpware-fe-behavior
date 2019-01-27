/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @fileOverview
 * Provides a class representing a finite state machine.
 * @author Xiaolong Tang <xxlongtang@gmail.com>
 * @license Copyright @me
 */
import * as dependencies from '@polpware/fe-dependencies';
import { replace as replaceStr } from '@polpware/fe-utilities';
// A set of helper functions
/** @type {?} */
const _ = dependencies.underscore;
/** @type {?} */
const StateMachine = dependencies['statemachine'];
/** @type {?} */
const indexOf = _.indexOf;
/** @type {?} */
const without = _.without;
/** @type {?} */
const transitionKeyFormat = '{from}2{to}';
/** @type {?} */
const errorMessageFormat = 'Transition {name} from {from} to {to} fails.';
/**
 * @param {?} value
 * @return {?}
 */
function captialize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
/**
 * @record
 */
function IUnderlyImpl() { }
if (false) {
    /** @type {?} */
    IUnderlyImpl.prototype.state;
    /**
     * @param {?} stateName
     * @return {?}
     */
    IUnderlyImpl.prototype.is = function (stateName) { };
    /**
     * @param {?} transitionName
     * @return {?}
     */
    IUnderlyImpl.prototype.cannot = function (transitionName) { };
    /**
     * @param {?} transitionName
     * @return {?}
     */
    IUnderlyImpl.prototype.fire = function (transitionName) { };
}
/**
 * @record
 */
function ILifeCycleEvent() { }
if (false) {
    /** @type {?} */
    ILifeCycleEvent.prototype.transition;
    /** @type {?} */
    ILifeCycleEvent.prototype.from;
    /** @type {?} */
    ILifeCycleEvent.prototype.to;
}
/**
 * @record
 */
function IStateSpecification() { }
if (false) {
    /** @type {?|undefined} */
    IStateSpecification.prototype.onEnterCallback;
    /** @type {?|undefined} */
    IStateSpecification.prototype.onLeaveCallback;
}
/**
 * @record
 */
function ITransitionSpecification() { }
if (false) {
    /** @type {?} */
    ITransitionSpecification.prototype.from;
    /** @type {?} */
    ITransitionSpecification.prototype.to;
    /** @type {?|undefined} */
    ITransitionSpecification.prototype.onBeforeCallback;
    /** @type {?|undefined} */
    ITransitionSpecification.prototype.onAfterCallback;
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
        const ourHandlers = context[key];
        if (!ourHandlers) {
            return;
        }
        for (let i = 0; i < ourHandlers.length; i++) {
            /** @type {?} */
            const func = ourHandlers[i];
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
    const info = replaceStr(errorMessageFormat, {
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
export class FiniteStateMachine {
    constructor() {
        this._impl = null;
        this._initState = null;
        this._errorHandler = null;
        this._stateConfiguration = {};
        this._transitionConfiguration = {};
        this._handlers = {};
    }
    /**
     * Checks if FSM is in configuration stage.
     * @private
     * @return {?}
     */
    ensureConfigureStage() {
        if (this._impl) {
            throw new Error('State machine has started.');
        }
    }
    /**
     * Checks if FSM is in running stage.
     * @private
     * @return {?}
     */
    ensureRunningStage() {
        if (!this._impl) {
            throw new Error('State machine has not yet started.');
        }
    }
    /**
     * Defines the behavior when the FSM moves into a state by a transition.
     * @template THIS
     * @this {THIS}
     * @param {?} name
     * @param {?=} onEnterCallback
     * @param {?=} onLeaveCallback
     * @return {THIS}
     */
    addState(name, onEnterCallback, onLeaveCallback) {
        // Pre-conditions
        (/** @type {?} */ (this)).ensureConfigureStage();
        /** @type {?} */
        const stateConf = (/** @type {?} */ (this))._stateConfiguration;
        if (stateConf[name]) {
            throw new Error('Redefined state: ' + name);
        }
        stateConf[name] = {
            onEnterCallback: onEnterCallback,
            onLeaveCallback: onLeaveCallback
        };
        return (/** @type {?} */ (this));
    }
    /**
     * Defines the init state for the FSM.
     * @template THIS
     * @this {THIS}
     * @param {?} name
     * @return {THIS}
     */
    setInitState(name) {
        // Pre-conditions
        (/** @type {?} */ (this)).ensureConfigureStage();
        if ((/** @type {?} */ (this))._initState) {
            throw new Error('Redefined init state: ' + (/** @type {?} */ (this))._initState);
        }
        (/** @type {?} */ (this))._initState = name;
        return (/** @type {?} */ (this));
    }
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
    addTransition(from, to, onAfterCallback, onBeforeCallback) {
        // Pre-condition
        (/** @type {?} */ (this)).ensureConfigureStage();
        /** @type {?} */
        const stateConf = (/** @type {?} */ (this))._stateConfiguration;
        /** @type {?} */
        const transitionConf = (/** @type {?} */ (this))._transitionConfiguration;
        if (!stateConf[from]) {
            throw new Error('Undefined source state: ' + from);
        }
        if (!stateConf[to]) {
            throw new Error('Undefined target state: ' + to);
        }
        /** @type {?} */
        const key = replaceStr(transitionKeyFormat, { from: from, to: to });
        if (transitionConf[key]) {
            throw new Error('Redefined transition: ' + from + ' -> ' + to);
        }
        transitionConf[key] = {
            from: from, to: to,
            onAfterCallback: onAfterCallback,
            onBeforeCallback: onBeforeCallback
        };
        return (/** @type {?} */ (this));
    }
    /**
     * Starts the FSM. Note that this method must be invoked before
     * any method which may change the state of the FSM.
     * @template THIS
     * @this {THIS}
     * @return {THIS}
     */
    start() {
        (/** @type {?} */ (this)).ensureConfigureStage();
        if (!(/** @type {?} */ (this))._initState) {
            throw new Error('Init state has not been defined.');
        }
        // Definition
        /** @type {?} */
        const stateConf = (/** @type {?} */ (this))._stateConfiguration;
        /** @type {?} */
        const transitionConf = (/** @type {?} */ (this))._transitionConfiguration;
        /** @type {?} */
        const transitions = [];
        /** @type {?} */
        const methods = {};
        for (const k1 in transitionConf) {
            if (transitionConf.hasOwnProperty(k1)) {
                /** @type {?} */
                const elem1 = transitionConf[k1];
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
        for (const k2 in stateConf) {
            if (stateConf.hasOwnProperty(k2)) {
                /** @type {?} */
                const elem2 = stateConf[k2];
                if (elem2.onEnterCallback) {
                    methods['onEnter' + captialize(k2)] = elem2.onEnterCallback;
                }
                if (elem2.onLeaveCallback) {
                    methods['onLeave' + captialize(k2)] = elem2.onLeaveCallback;
                }
            }
        }
        /** @type {?} */
        const handlers = (/** @type {?} */ (this))._handlers;
        handlers.onEnterState = [];
        handlers.onLeaveState = [];
        methods['onEnterState'] = buildHandlerInClosure((/** @type {?} */ (this))._handlers, 'onEnterState');
        methods['onLeaveState'] = buildHandlerInClosure((/** @type {?} */ (this))._handlers, 'onLeaveState');
        (/** @type {?} */ (this))._impl = new StateMachine({
            init: (/** @type {?} */ (this))._initState,
            transitions: transitions,
            methods: methods,
            onInvalidTransition: (/** @type {?} */ (this))._errorHandler || defaultErrorHandler
        });
        return (/** @type {?} */ (this));
    }
    /**
     * Registers a handler for enterstate
     * @template THIS
     * @this {THIS}
     * @param {?} handler
     * @return {THIS}
     */
    onEnterState(handler) {
        /** @type {?} */
        const ourHandlers = (/** @type {?} */ (this))._handlers.onEnterState;
        if (indexOf(ourHandlers, handler) >= 0) {
            throw new Error('Re-registering a hander!');
        }
        ourHandlers.push(handler);
        return (/** @type {?} */ (this));
    }
    /**
     * Registers a handler for exitstate
     * @template THIS
     * @this {THIS}
     * @param {?} handler
     * @return {THIS}
     */
    onExitState(handler) {
        /** @type {?} */
        const ourHandlers = (/** @type {?} */ (this))._handlers.onLeaveState;
        if (indexOf(ourHandlers, handler) >= 0) {
            throw new Error('Registering a hander!');
        }
        ourHandlers.push(handler);
        return (/** @type {?} */ (this));
    }
    /**
     * Un-register a handler for enterstate
     * @template THIS
     * @this {THIS}
     * @param {?} handler
     * @return {THIS}
     */
    offEnterState(handler) {
        /** @type {?} */
        const ourHandlers = (/** @type {?} */ (this))._handlers.onEnterState;
        (/** @type {?} */ (this))._handlers.onenterstate = without(ourHandlers, handler);
        return (/** @type {?} */ (this));
    }
    /**
     * Un-register a handler for exitstate
     * @template THIS
     * @this {THIS}
     * @param {?} handler
     * @return {THIS}
     */
    offExitState(handler) {
        /** @type {?} */
        const ourHandlers = (/** @type {?} */ (this))._handlers.onLeaveState;
        (/** @type {?} */ (this))._handlers.onexitstate = without(ourHandlers, handler);
        return (/** @type {?} */ (this));
    }
    /**
     * Performs a transition to the given state.
     * This method also validate the transition.
     * @param {?} to
     * @return {?}
     */
    go(to) {
        this.ensureRunningStage();
        /** @type {?} */
        const stateConf = this._stateConfiguration;
        if (!stateConf[to]) {
            throw new Error('Go to undefined state: ' + to);
        }
        if (this._impl.is(to)) {
            // TODO: check if the underlying implementation takes into account
            // moving from one state to itself
            return this;
        }
        /** @type {?} */
        const currentState = this._impl.state;
        /** @type {?} */
        const transitionName = replaceStr(transitionKeyFormat, { from: currentState, to: to });
        // Validate if this transition is allowed or not
        if (this._impl.cannot(transitionName)) {
            throw new Error('Transition is not allowed: ' + currentState + ' -> ' + to);
        }
        // Invoke this function
        /** @type {?} */
        const func = this._impl[transitionName];
        func.call(this._impl);
        return self;
    }
    /**
     * Provides the error handler for the FSM.
     * @template THIS
     * @this {THIS}
     * @param {?} fn
     * @return {THIS}
     */
    addErrorHandler(fn) {
        (/** @type {?} */ (this)).ensureConfigureStage();
        (/** @type {?} */ (this))._errorHandler = fn;
        return (/** @type {?} */ (this));
    }
    /**
     * Returns the current state.
     * @return {?}
     */
    current() {
        this.ensureRunningStage();
        return this._impl.state;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    FiniteStateMachine.prototype._impl;
    /**
     * @type {?}
     * @private
     */
    FiniteStateMachine.prototype._initState;
    /**
     * @type {?}
     * @private
     */
    FiniteStateMachine.prototype._errorHandler;
    /**
     * @type {?}
     * @private
     */
    FiniteStateMachine.prototype._stateConfiguration;
    /**
     * @type {?}
     * @private
     */
    FiniteStateMachine.prototype._transitionConfiguration;
    /**
     * @type {?}
     * @private
     */
    FiniteStateMachine.prototype._handlers;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluaXRlLXN0YXRlLW1hY2hpbmUuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9AcG9scHdhcmUvZmUtYmVoYXZpb3IvIiwic291cmNlcyI6WyJsaWIvc3RhdGUvZmluaXRlLXN0YXRlLW1hY2hpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQU1BLE9BQU8sS0FBSyxZQUFZLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFFLE9BQU8sSUFBSSxVQUFVLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQzs7O01BR3pELENBQUMsR0FBRyxZQUFZLENBQUMsVUFBVTs7TUFDM0IsWUFBWSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUM7O01BQzNDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTzs7TUFDbkIsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPOztNQUNuQixtQkFBbUIsR0FBRyxhQUFhOztNQUNuQyxrQkFBa0IsR0FBRyw4Q0FBOEM7Ozs7O0FBR3pFLFNBQVMsVUFBVSxDQUFDLEtBQWE7SUFDN0IsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsQ0FBQzs7OztBQUVELDJCQUtDOzs7SUFKRyw2QkFBYzs7Ozs7SUFDZCxxREFBK0I7Ozs7O0lBQy9CLDhEQUF3Qzs7Ozs7SUFDeEMsNERBQWtDOzs7OztBQUd0Qyw4QkFJQzs7O0lBSEcscUNBQW1COztJQUNuQiwrQkFBYTs7SUFDYiw2QkFBVzs7Ozs7QUFNZixrQ0FHQzs7O0lBRkcsOENBQXFDOztJQUNyQyw4Q0FBcUM7Ozs7O0FBR3pDLHVDQUtDOzs7SUFKRyx3Q0FBYTs7SUFDYixzQ0FBVzs7SUFDWCxvREFBc0M7O0lBQ3RDLG1EQUFxQzs7Ozs7Ozs7O0FBT3pDLFNBQVMscUJBQXFCLENBQUMsT0FBcUQsRUFBRSxHQUFXO0lBQzdGLE9BQU87O2NBQ0csV0FBVyxHQUFHLE9B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QUFHLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3RGLGdEQUFnRDtRQUNoRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLEdBQUcsWUFBWSxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztTQUMvRTs7O2NBR0ssSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Ozs7Ozs7O0lBS0QsZUFBZSxDQUFDLEVBQW9CO1FBQ2hDLG1CQUFBLElBQUksRUFBQSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFNUIsbUJBQUEsSUFBSSxFQUFBLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUV4QixPQUFPLG1CQUFBLElBQUksRUFBQSxDQUFDO0lBQ2hCLENBQUM7Ozs7O0lBS0QsT0FBTztRQUNILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDNUIsQ0FBQztDQUNKOzs7Ozs7SUE1UEcsbUNBQTRCOzs7OztJQUM1Qix3Q0FBMkI7Ozs7O0lBQzNCLDJDQUF3Qzs7Ozs7SUFDeEMsaURBQW9FOzs7OztJQUNwRSxzREFBOEU7Ozs7O0lBQzlFLHVDQUFnRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVPdmVydmlld1xuICogUHJvdmlkZXMgYSBjbGFzcyByZXByZXNlbnRpbmcgYSBmaW5pdGUgc3RhdGUgbWFjaGluZS5cbiAqIEBhdXRob3IgWGlhb2xvbmcgVGFuZyA8eHhsb25ndGFuZ0BnbWFpbC5jb20+XG4gKiBAbGljZW5zZSBDb3B5cmlnaHQgQG1lXG4gKi9cbmltcG9ydCAqIGFzIGRlcGVuZGVuY2llcyBmcm9tICdAcG9scHdhcmUvZmUtZGVwZW5kZW5jaWVzJztcbmltcG9ydCB7IHJlcGxhY2UgYXMgcmVwbGFjZVN0ciB9IGZyb20gJ0Bwb2xwd2FyZS9mZS11dGlsaXRpZXMnO1xuXG4vLyBBIHNldCBvZiBoZWxwZXIgZnVuY3Rpb25zXG5jb25zdCBfID0gZGVwZW5kZW5jaWVzLnVuZGVyc2NvcmU7XG5jb25zdCBTdGF0ZU1hY2hpbmUgPSBkZXBlbmRlbmNpZXNbJ3N0YXRlbWFjaGluZSddO1xuY29uc3QgaW5kZXhPZiA9IF8uaW5kZXhPZjtcbmNvbnN0IHdpdGhvdXQgPSBfLndpdGhvdXQ7XG5jb25zdCB0cmFuc2l0aW9uS2V5Rm9ybWF0ID0gJ3tmcm9tfTJ7dG99JztcbmNvbnN0IGVycm9yTWVzc2FnZUZvcm1hdCA9ICdUcmFuc2l0aW9uIHtuYW1lfSBmcm9tIHtmcm9tfSB0byB7dG99IGZhaWxzLic7XG5cblxuZnVuY3Rpb24gY2FwdGlhbGl6ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB2YWx1ZS5zbGljZSgxKTtcbn1cblxuaW50ZXJmYWNlIElVbmRlcmx5SW1wbCB7XG4gICAgc3RhdGU6IHN0cmluZztcbiAgICBpcyhzdGF0ZU5hbWU6IHN0cmluZyk6IGJvb2xlYW47XG4gICAgY2Fubm90KHRyYW5zaXRpb25OYW1lOiBzdHJpbmcpOiBib29sZWFuO1xuICAgIGZpcmUodHJhbnNpdGlvbk5hbWU6IHN0cmluZyk6IGFueTtcbn1cblxuaW50ZXJmYWNlIElMaWZlQ3ljbGVFdmVudCB7XG4gICAgdHJhbnNpdGlvbjogc3RyaW5nO1xuICAgIGZyb206IHN0cmluZztcbiAgICB0bzogc3RyaW5nO1xufVxuXG50eXBlIE1ldGhvZENhbGxiYWNrVHlwZSA9IChJTGlmZUN5Y2xlRXZlbnQpID0+IHZvaWQ7XG50eXBlIEVycm9ySGFuZGxlclR5cGUgPSAobmFtZTogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpID0+IHZvaWQ7XG5cbmludGVyZmFjZSBJU3RhdGVTcGVjaWZpY2F0aW9uIHtcbiAgICBvbkVudGVyQ2FsbGJhY2s/OiBNZXRob2RDYWxsYmFja1R5cGU7XG4gICAgb25MZWF2ZUNhbGxiYWNrPzogTWV0aG9kQ2FsbGJhY2tUeXBlO1xufVxuXG5pbnRlcmZhY2UgSVRyYW5zaXRpb25TcGVjaWZpY2F0aW9uIHtcbiAgICBmcm9tOiBzdHJpbmc7XG4gICAgdG86IHN0cmluZztcbiAgICBvbkJlZm9yZUNhbGxiYWNrPzogTWV0aG9kQ2FsbGJhY2tUeXBlO1xuICAgIG9uQWZ0ZXJDYWxsYmFjaz86IE1ldGhvZENhbGxiYWNrVHlwZTtcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBoYW5kbGVyIHdpdGggbmVjZXNzYXJ5IGNvbnRleHQgaW5mb3JtYXRpb24uXG4gKiBUaGUgcmVzdWx0aW5nIHJldHVybiB2YWx1ZSBpcyBhIGNsb3N1cmUgaW5kZWVkLlxuICovXG5mdW5jdGlvbiBidWlsZEhhbmRsZXJJbkNsb3N1cmUoY29udGV4dDogeyBba2V5OiBzdHJpbmddOiBBcnJheTxNZXRob2RDYWxsYmFja1R5cGU+IH0sIGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBvdXJIYW5kbGVycyA9IGNvbnRleHRba2V5XTtcbiAgICAgICAgaWYgKCFvdXJIYW5kbGVycykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3VySGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBvdXJIYW5kbGVyc1tpXTtcbiAgICAgICAgICAgIGZ1bmMuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8qKlxuICogRGVmYXVsdCBlcnJvciBoYW5kbGVyIGZvciB0aGUgRlNNLlxuICovXG5mdW5jdGlvbiBkZWZhdWx0RXJyb3JIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBpbmZvID0gcmVwbGFjZVN0cihlcnJvck1lc3NhZ2VGb3JtYXQsIHtcbiAgICAgICAgbmFtZTogZXZlbnROYW1lLFxuICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICB0bzogdG9cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhpbmZvKTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgZmluaXRlIHN0YXRlIG1hY2hpbmUuXG4gKiBUaGUgcmVzdWx0aW5nIEZTTSBpcyBidWlsdCB1cG9uIGEgY29tbW9ubHkgdXNlZCBqYXZhc2NyaXB0XG4gKiBzdGF0ZSBtYWNoaW5lIGxpYnJhcnkuXG4gKiBTdWNoIGEgZGVzaWduIChvZiBhcmNoaXRlY3R1cmUpIGlzIGJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgY29uc2lkZXJhdGlvbnM6XG4gKiAtIEEgdXNlci1mcmllbmRseSBpbnRlcmZhY2UgZm9yIGRlZmluaW5nIHN0YXRlcyBhbmQgdGhlaXIgYmVoYXZpb3JzXG4gKiAtIEEga2luZCBvZiBtb2RlbC1jaGVja2luZyBjYXBhYmlsaXR5IGZvciB2ZXJpZnlpbmcgdGhlIGNvcnJlY3RuZXNzIG9mXG4gKiB0cmFuc2l0aW9uc1xuICogLSBTdXBwb3J0IGZvciBhc3ljaHJvbm91cyBhbmQgc3luY2hyb3VzIHRyYW5zaXRpb25zXG4gKiAtIFN1cHBvcnQgZm9yIGdsb2JhbCBleGNlcHRpb24gaGFuZGxpbmdcbiAqIEBjbGFzcyBGU01cbiAqL1xuZXhwb3J0IGNsYXNzIEZpbml0ZVN0YXRlTWFjaGluZSB7XG5cbiAgICBwcml2YXRlIF9pbXBsOiBJVW5kZXJseUltcGw7XG4gICAgcHJpdmF0ZSBfaW5pdFN0YXRlOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJUeXBlO1xuICAgIHByaXZhdGUgX3N0YXRlQ29uZmlndXJhdGlvbjogeyBba2V5OiBzdHJpbmddOiBJU3RhdGVTcGVjaWZpY2F0aW9uIH07XG4gICAgcHJpdmF0ZSBfdHJhbnNpdGlvbkNvbmZpZ3VyYXRpb246IHsgW2tleTogc3RyaW5nXTogSVRyYW5zaXRpb25TcGVjaWZpY2F0aW9uIH07XG4gICAgcHJpdmF0ZSBfaGFuZGxlcnM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8TWV0aG9kQ2FsbGJhY2tUeXBlPiB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2ltcGwgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbml0U3RhdGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9lcnJvckhhbmRsZXIgPSBudWxsO1xuICAgICAgICB0aGlzLl9zdGF0ZUNvbmZpZ3VyYXRpb24gPSB7fTtcbiAgICAgICAgdGhpcy5fdHJhbnNpdGlvbkNvbmZpZ3VyYXRpb24gPSB7fTtcbiAgICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgRlNNIGlzIGluIGNvbmZpZ3VyYXRpb24gc3RhZ2UuXG4gICAgICovXG4gICAgcHJpdmF0ZSBlbnN1cmVDb25maWd1cmVTdGFnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ltcGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3RhdGUgbWFjaGluZSBoYXMgc3RhcnRlZC4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBGU00gaXMgaW4gcnVubmluZyBzdGFnZS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGVuc3VyZVJ1bm5pbmdTdGFnZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbXBsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0YXRlIG1hY2hpbmUgaGFzIG5vdCB5ZXQgc3RhcnRlZC4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgdGhlIGJlaGF2aW9yIHdoZW4gdGhlIEZTTSBtb3ZlcyBpbnRvIGEgc3RhdGUgYnkgYSB0cmFuc2l0aW9uLlxuICAgICAqL1xuICAgIGFkZFN0YXRlKG5hbWU6IHN0cmluZyxcbiAgICAgICAgb25FbnRlckNhbGxiYWNrPzogTWV0aG9kQ2FsbGJhY2tUeXBlLFxuICAgICAgICBvbkxlYXZlQ2FsbGJhY2s/OiBNZXRob2RDYWxsYmFja1R5cGUpIHtcbiAgICAgICAgLy8gUHJlLWNvbmRpdGlvbnNcbiAgICAgICAgdGhpcy5lbnN1cmVDb25maWd1cmVTdGFnZSgpO1xuICAgICAgICBjb25zdCBzdGF0ZUNvbmYgPSB0aGlzLl9zdGF0ZUNvbmZpZ3VyYXRpb247XG4gICAgICAgIGlmIChzdGF0ZUNvbmZbbmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmVkZWZpbmVkIHN0YXRlOiAnICsgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGVDb25mW25hbWVdID0ge1xuICAgICAgICAgICAgb25FbnRlckNhbGxiYWNrOiBvbkVudGVyQ2FsbGJhY2ssXG4gICAgICAgICAgICBvbkxlYXZlQ2FsbGJhY2s6IG9uTGVhdmVDYWxsYmFja1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIHRoZSBpbml0IHN0YXRlIGZvciB0aGUgRlNNLlxuICAgICAqL1xuICAgIHNldEluaXRTdGF0ZShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gUHJlLWNvbmRpdGlvbnNcbiAgICAgICAgdGhpcy5lbnN1cmVDb25maWd1cmVTdGFnZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLl9pbml0U3RhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmVkZWZpbmVkIGluaXQgc3RhdGU6ICcgKyB0aGlzLl9pbml0U3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2luaXRTdGF0ZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgYSBuZXcgc3RyYW5zaXRpb24uXG4gICAgICovXG4gICAgYWRkVHJhbnNpdGlvbihmcm9tOiBzdHJpbmcsXG4gICAgICAgIHRvOiBzdHJpbmcsXG4gICAgICAgIG9uQWZ0ZXJDYWxsYmFjaz86IE1ldGhvZENhbGxiYWNrVHlwZSxcbiAgICAgICAgb25CZWZvcmVDYWxsYmFjaz86IE1ldGhvZENhbGxiYWNrVHlwZSkge1xuICAgICAgICAvLyBQcmUtY29uZGl0aW9uXG4gICAgICAgIHRoaXMuZW5zdXJlQ29uZmlndXJlU3RhZ2UoKTtcblxuICAgICAgICBjb25zdCBzdGF0ZUNvbmYgPSB0aGlzLl9zdGF0ZUNvbmZpZ3VyYXRpb247XG4gICAgICAgIGNvbnN0IHRyYW5zaXRpb25Db25mID0gdGhpcy5fdHJhbnNpdGlvbkNvbmZpZ3VyYXRpb247XG4gICAgICAgIGlmICghc3RhdGVDb25mW2Zyb21dKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZGVmaW5lZCBzb3VyY2Ugc3RhdGU6ICcgKyBmcm9tKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0YXRlQ29uZlt0b10pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5kZWZpbmVkIHRhcmdldCBzdGF0ZTogJyArIHRvKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXkgPSByZXBsYWNlU3RyKHRyYW5zaXRpb25LZXlGb3JtYXQsIHsgZnJvbTogZnJvbSwgdG86IHRvIH0pO1xuICAgICAgICBpZiAodHJhbnNpdGlvbkNvbmZba2V5XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWRlZmluZWQgdHJhbnNpdGlvbjogJyArIGZyb20gKyAnIC0+ICcgKyB0byk7XG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNpdGlvbkNvbmZba2V5XSA9IHtcbiAgICAgICAgICAgIGZyb206IGZyb20sIHRvOiB0byxcbiAgICAgICAgICAgIG9uQWZ0ZXJDYWxsYmFjazogb25BZnRlckNhbGxiYWNrLFxuICAgICAgICAgICAgb25CZWZvcmVDYWxsYmFjazogb25CZWZvcmVDYWxsYmFja1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydHMgdGhlIEZTTS4gTm90ZSB0aGF0IHRoaXMgbWV0aG9kIG11c3QgYmUgaW52b2tlZCBiZWZvcmVcbiAgICAgKiBhbnkgbWV0aG9kIHdoaWNoIG1heSBjaGFuZ2UgdGhlIHN0YXRlIG9mIHRoZSBGU00uXG4gICAgICovXG4gICAgc3RhcnQoKSB7XG5cbiAgICAgICAgdGhpcy5lbnN1cmVDb25maWd1cmVTdGFnZSgpO1xuICAgICAgICBpZiAoIXRoaXMuX2luaXRTdGF0ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbml0IHN0YXRlIGhhcyBub3QgYmVlbiBkZWZpbmVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVmaW5pdGlvblxuICAgICAgICBjb25zdCBzdGF0ZUNvbmY6IE9iamVjdCA9IHRoaXMuX3N0YXRlQ29uZmlndXJhdGlvbjtcbiAgICAgICAgY29uc3QgdHJhbnNpdGlvbkNvbmY6IE9iamVjdCA9IHRoaXMuX3RyYW5zaXRpb25Db25maWd1cmF0aW9uO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zaXRpb25zOiBBcnJheTx7IG5hbWU6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nIH0+ID0gW107XG4gICAgICAgIGNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogTWV0aG9kQ2FsbGJhY2tUeXBlIH0gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IGsxIGluIHRyYW5zaXRpb25Db25mKSB7XG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbkNvbmYuaGFzT3duUHJvcGVydHkoazEpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbTEgPSB0cmFuc2l0aW9uQ29uZltrMV07XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGsxLFxuICAgICAgICAgICAgICAgICAgICBmcm9tOiBlbGVtMS5mcm9tLFxuICAgICAgICAgICAgICAgICAgICB0bzogZWxlbTEudG9cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChlbGVtMS5vbkFmdGVyQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kc1snb25BZnRlcicgKyBjYXB0aWFsaXplKGsxKV0gPSBlbGVtMS5vbkFmdGVyQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbGVtMS5vbkJlZm9yZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbJ29uQmVmb3JlJyArIGNhcHRpYWxpemUoazEpXSA9IGVsZW0xLm9uQWZ0ZXJDYWxsYmFjaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGsyIGluIHN0YXRlQ29uZikge1xuXG4gICAgICAgICAgICBpZiAoc3RhdGVDb25mLmhhc093blByb3BlcnR5KGsyKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gc3RhdGVDb25mW2syXTtcblxuICAgICAgICAgICAgICAgIGlmIChlbGVtMi5vbkVudGVyQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kc1snb25FbnRlcicgKyBjYXB0aWFsaXplKGsyKV0gPSBlbGVtMi5vbkVudGVyQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbGVtMi5vbkxlYXZlQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kc1snb25MZWF2ZScgKyBjYXB0aWFsaXplKGsyKV0gPSBlbGVtMi5vbkxlYXZlQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVycztcbiAgICAgICAgaGFuZGxlcnMub25FbnRlclN0YXRlID0gW107XG4gICAgICAgIGhhbmRsZXJzLm9uTGVhdmVTdGF0ZSA9IFtdO1xuXG4gICAgICAgIG1ldGhvZHNbJ29uRW50ZXJTdGF0ZSddID0gYnVpbGRIYW5kbGVySW5DbG9zdXJlKHRoaXMuX2hhbmRsZXJzLCAnb25FbnRlclN0YXRlJyk7XG4gICAgICAgIG1ldGhvZHNbJ29uTGVhdmVTdGF0ZSddID0gYnVpbGRIYW5kbGVySW5DbG9zdXJlKHRoaXMuX2hhbmRsZXJzLCAnb25MZWF2ZVN0YXRlJyk7XG5cbiAgICAgICAgdGhpcy5faW1wbCA9IG5ldyBTdGF0ZU1hY2hpbmUoe1xuICAgICAgICAgICAgaW5pdDogdGhpcy5faW5pdFN0YXRlLFxuICAgICAgICAgICAgdHJhbnNpdGlvbnM6IHRyYW5zaXRpb25zLFxuICAgICAgICAgICAgbWV0aG9kczogbWV0aG9kcyxcbiAgICAgICAgICAgIG9uSW52YWxpZFRyYW5zaXRpb246IHRoaXMuX2Vycm9ySGFuZGxlciB8fCBkZWZhdWx0RXJyb3JIYW5kbGVyXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgYSBoYW5kbGVyIGZvciBlbnRlcnN0YXRlXG4gICAgICovXG4gICAgb25FbnRlclN0YXRlKGhhbmRsZXI6IE1ldGhvZENhbGxiYWNrVHlwZSkge1xuICAgICAgICBjb25zdCBvdXJIYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzLm9uRW50ZXJTdGF0ZTtcbiAgICAgICAgaWYgKGluZGV4T2Yob3VySGFuZGxlcnMsIGhhbmRsZXIpID49IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmUtcmVnaXN0ZXJpbmcgYSBoYW5kZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgb3VySGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGEgaGFuZGxlciBmb3IgZXhpdHN0YXRlXG4gICAgICovXG4gICAgb25FeGl0U3RhdGUoaGFuZGxlcjogTWV0aG9kQ2FsbGJhY2tUeXBlKSB7XG4gICAgICAgIGNvbnN0IG91ckhhbmRsZXJzID0gdGhpcy5faGFuZGxlcnMub25MZWF2ZVN0YXRlO1xuICAgICAgICBpZiAoaW5kZXhPZihvdXJIYW5kbGVycywgaGFuZGxlcikgPj0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWdpc3RlcmluZyBhIGhhbmRlciEnKTtcbiAgICAgICAgfVxuICAgICAgICBvdXJIYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbi1yZWdpc3RlciBhIGhhbmRsZXIgZm9yIGVudGVyc3RhdGVcbiAgICAgKi9cbiAgICBvZmZFbnRlclN0YXRlKGhhbmRsZXI6IE1ldGhvZENhbGxiYWNrVHlwZSkge1xuICAgICAgICBjb25zdCBvdXJIYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzLm9uRW50ZXJTdGF0ZTtcbiAgICAgICAgdGhpcy5faGFuZGxlcnMub25lbnRlcnN0YXRlID0gd2l0aG91dChvdXJIYW5kbGVycywgaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVuLXJlZ2lzdGVyIGEgaGFuZGxlciBmb3IgZXhpdHN0YXRlXG4gICAgICovXG4gICAgb2ZmRXhpdFN0YXRlKGhhbmRsZXI6IE1ldGhvZENhbGxiYWNrVHlwZSkge1xuICAgICAgICBjb25zdCBvdXJIYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzLm9uTGVhdmVTdGF0ZTtcbiAgICAgICAgdGhpcy5faGFuZGxlcnMub25leGl0c3RhdGUgPSB3aXRob3V0KG91ckhhbmRsZXJzLCBoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSB0cmFuc2l0aW9uIHRvIHRoZSBnaXZlbiBzdGF0ZS5cbiAgICAgKiBUaGlzIG1ldGhvZCBhbHNvIHZhbGlkYXRlIHRoZSB0cmFuc2l0aW9uLlxuICAgICAqL1xuICAgIGdvKHRvOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVSdW5uaW5nU3RhZ2UoKTtcblxuICAgICAgICBjb25zdCBzdGF0ZUNvbmYgPSB0aGlzLl9zdGF0ZUNvbmZpZ3VyYXRpb247XG4gICAgICAgIGlmICghc3RhdGVDb25mW3RvXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHbyB0byB1bmRlZmluZWQgc3RhdGU6ICcgKyB0byk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2ltcGwuaXModG8pKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGUgdW5kZXJseWluZyBpbXBsZW1lbnRhdGlvbiB0YWtlcyBpbnRvIGFjY291bnRcbiAgICAgICAgICAgIC8vIG1vdmluZyBmcm9tIG9uZSBzdGF0ZSB0byBpdHNlbGZcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IHRoaXMuX2ltcGwuc3RhdGU7XG4gICAgICAgIGNvbnN0IHRyYW5zaXRpb25OYW1lID0gcmVwbGFjZVN0cih0cmFuc2l0aW9uS2V5Rm9ybWF0LCB7IGZyb206IGN1cnJlbnRTdGF0ZSwgdG86IHRvIH0pO1xuICAgICAgICAvLyBWYWxpZGF0ZSBpZiB0aGlzIHRyYW5zaXRpb24gaXMgYWxsb3dlZCBvciBub3RcbiAgICAgICAgaWYgKHRoaXMuX2ltcGwuY2Fubm90KHRyYW5zaXRpb25OYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2l0aW9uIGlzIG5vdCBhbGxvd2VkOiAnICsgY3VycmVudFN0YXRlICsgJyAtPiAnICsgdG8pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW52b2tlIHRoaXMgZnVuY3Rpb25cbiAgICAgICAgY29uc3QgZnVuYyA9IHRoaXMuX2ltcGxbdHJhbnNpdGlvbk5hbWVdO1xuICAgICAgICBmdW5jLmNhbGwodGhpcy5faW1wbCk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIHRoZSBlcnJvciBoYW5kbGVyIGZvciB0aGUgRlNNLlxuICAgICAqL1xuICAgIGFkZEVycm9ySGFuZGxlcihmbjogRXJyb3JIYW5kbGVyVHlwZSkge1xuICAgICAgICB0aGlzLmVuc3VyZUNvbmZpZ3VyZVN0YWdlKCk7XG5cbiAgICAgICAgdGhpcy5fZXJyb3JIYW5kbGVyID0gZm47XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICAgKi9cbiAgICBjdXJyZW50KCkge1xuICAgICAgICB0aGlzLmVuc3VyZVJ1bm5pbmdTdGFnZSgpO1xuICAgICAgICByZXR1cm4gdGhpcy5faW1wbC5zdGF0ZTtcbiAgICB9XG59XG4iXX0=