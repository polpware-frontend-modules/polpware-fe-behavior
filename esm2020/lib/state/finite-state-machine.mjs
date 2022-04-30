/**
 * @fileOverview
 * Provides a class representing a finite state machine.
 * @author Xiaolong Tang <xxlongtang@gmail.com>
 * @license Copyright @me
 */
import * as dependencies from '@polpware/fe-dependencies';
import { replace as replaceStr } from '@polpware/fe-utilities';
// A set of helper functions
const _ = dependencies.underscore;
const StateMachine = dependencies['statemachine'];
const indexOf = _.indexOf;
const without = _.without;
const transitionKeyFormat = '{from}2{to}';
const errorMessageFormat = 'Transition {name} from {from} to {to} fails.';
function captialize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
/**
 * Builds a handler with necessary context information.
 * The resulting return value is a closure indeed.
 */
function buildHandlerInClosure(context, key) {
    return function () {
        const ourHandlers = context[key];
        if (!ourHandlers) {
            return;
        }
        for (let i = 0; i < ourHandlers.length; i++) {
            const func = ourHandlers[i];
            func.apply(null, arguments);
        }
    };
}
/**
 * Default error handler for the FSM.
 */
function defaultErrorHandler(eventName, from, to) {
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
 * @class FSM
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
     */
    ensureConfigureStage() {
        if (this._impl) {
            throw new Error('State machine has started.');
        }
    }
    /**
     * Checks if FSM is in running stage.
     */
    ensureRunningStage() {
        if (!this._impl) {
            throw new Error('State machine has not yet started.');
        }
    }
    /**
     * Defines the behavior when the FSM moves into a state by a transition.
     */
    addState(name, onEnterCallback, onLeaveCallback) {
        // Pre-conditions
        this.ensureConfigureStage();
        const stateConf = this._stateConfiguration;
        if (stateConf[name]) {
            throw new Error('Redefined state: ' + name);
        }
        stateConf[name] = {
            onEnterCallback: onEnterCallback,
            onLeaveCallback: onLeaveCallback
        };
        return this;
    }
    /**
     * Defines the init state for the FSM.
     */
    setInitState(name) {
        // Pre-conditions
        this.ensureConfigureStage();
        if (this._initState) {
            throw new Error('Redefined init state: ' + this._initState);
        }
        this._initState = name;
        return this;
    }
    /**
     * Defines a new stransition.
     */
    addTransition(from, to, onAfterCallback, onBeforeCallback) {
        // Pre-condition
        this.ensureConfigureStage();
        const stateConf = this._stateConfiguration;
        const transitionConf = this._transitionConfiguration;
        if (!stateConf[from]) {
            throw new Error('Undefined source state: ' + from);
        }
        if (!stateConf[to]) {
            throw new Error('Undefined target state: ' + to);
        }
        const key = replaceStr(transitionKeyFormat, { from: from, to: to });
        if (transitionConf[key]) {
            throw new Error('Redefined transition: ' + from + ' -> ' + to);
        }
        transitionConf[key] = {
            from: from, to: to,
            onAfterCallback: onAfterCallback,
            onBeforeCallback: onBeforeCallback
        };
        return this;
    }
    /**
     * Starts the FSM. Note that this method must be invoked before
     * any method which may change the state of the FSM.
     */
    start() {
        this.ensureConfigureStage();
        if (!this._initState) {
            throw new Error('Init state has not been defined.');
        }
        // Definition
        const stateConf = this._stateConfiguration;
        const transitionConf = this._transitionConfiguration;
        const transitions = [];
        const methods = {};
        for (const k1 in transitionConf) {
            if (transitionConf.hasOwnProperty(k1)) {
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
                const elem2 = stateConf[k2];
                if (elem2.onEnterCallback) {
                    methods['onEnter' + captialize(k2)] = elem2.onEnterCallback;
                }
                if (elem2.onLeaveCallback) {
                    methods['onLeave' + captialize(k2)] = elem2.onLeaveCallback;
                }
            }
        }
        const handlers = this._handlers;
        handlers.onEnterState = [];
        handlers.onLeaveState = [];
        methods['onEnterState'] = buildHandlerInClosure(this._handlers, 'onEnterState');
        methods['onLeaveState'] = buildHandlerInClosure(this._handlers, 'onLeaveState');
        this._impl = new StateMachine({
            init: this._initState,
            transitions: transitions,
            methods: methods,
            onInvalidTransition: this._errorHandler || defaultErrorHandler
        });
        return this;
    }
    /**
     * Registers a handler for enterstate
     */
    onEnterState(handler) {
        const ourHandlers = this._handlers.onEnterState;
        if (indexOf(ourHandlers, handler) >= 0) {
            throw new Error('Re-registering a hander!');
        }
        ourHandlers.push(handler);
        return this;
    }
    /**
     * Registers a handler for exitstate
     */
    onExitState(handler) {
        const ourHandlers = this._handlers.onLeaveState;
        if (indexOf(ourHandlers, handler) >= 0) {
            throw new Error('Registering a hander!');
        }
        ourHandlers.push(handler);
        return this;
    }
    /**
     * Un-register a handler for enterstate
     */
    offEnterState(handler) {
        const ourHandlers = this._handlers.onEnterState;
        this._handlers.onenterstate = without(ourHandlers, handler);
        return this;
    }
    /**
     * Un-register a handler for exitstate
     */
    offExitState(handler) {
        const ourHandlers = this._handlers.onLeaveState;
        this._handlers.onexitstate = without(ourHandlers, handler);
        return this;
    }
    /**
     * Performs a transition to the given state.
     * This method also validate the transition.
     */
    go(to) {
        this.ensureRunningStage();
        const stateConf = this._stateConfiguration;
        if (!stateConf[to]) {
            throw new Error('Go to undefined state: ' + to);
        }
        if (this._impl.is(to)) {
            // TODO: check if the underlying implementation takes into account
            // moving from one state to itself
            return this;
        }
        const currentState = this._impl.state;
        const transitionName = replaceStr(transitionKeyFormat, { from: currentState, to: to });
        // Validate if this transition is allowed or not
        if (this._impl.cannot(transitionName)) {
            throw new Error('Transition is not allowed: ' + currentState + ' -> ' + to);
        }
        // Invoke this function
        const func = this._impl[transitionName];
        func.call(this._impl);
        return self;
    }
    /**
     * Provides the error handler for the FSM.
     */
    addErrorHandler(fn) {
        this.ensureConfigureStage();
        this._errorHandler = fn;
        return this;
    }
    /**
     * Returns the current state.
     */
    current() {
        this.ensureRunningStage();
        return this._impl.state;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluaXRlLXN0YXRlLW1hY2hpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9wb2xwd2FyZS9mZS1iZWhhdmlvci9zcmMvbGliL3N0YXRlL2Zpbml0ZS1zdGF0ZS1tYWNoaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztHQUtHO0FBQ0gsT0FBTyxLQUFLLFlBQVksTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQUUsT0FBTyxJQUFJLFVBQVUsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBRS9ELDRCQUE0QjtBQUM1QixNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDO0FBQ2xDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNsRCxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQzFCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDMUIsTUFBTSxtQkFBbUIsR0FBRyxhQUFhLENBQUM7QUFDMUMsTUFBTSxrQkFBa0IsR0FBRyw4Q0FBOEMsQ0FBQztBQUcxRSxTQUFTLFVBQVUsQ0FBQyxLQUFhO0lBQzdCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUE4QkQ7OztHQUdHO0FBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxPQUFxRCxFQUFFLEdBQVc7SUFDN0YsT0FBTztRQUNILE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2QsT0FBTztTQUNWO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDekMsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQy9CO0lBQ0wsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLElBQVksRUFBRSxFQUFVO0lBQ3BFLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRTtRQUN4QyxJQUFJLEVBQUUsU0FBUztRQUNmLElBQUksRUFBRSxJQUFJO1FBQ1YsRUFBRSxFQUFFLEVBQUU7S0FDVCxDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sT0FBTyxrQkFBa0I7SUFTM0I7UUFDSSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssb0JBQW9CO1FBQ3hCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztTQUNqRDtJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLGtCQUFrQjtRQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztTQUN6RDtJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVEsQ0FBQyxJQUFZLEVBQ2pCLGVBQW9DLEVBQ3BDLGVBQW9DO1FBQ3BDLGlCQUFpQjtRQUNqQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM1QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDM0MsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUMvQztRQUNELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRztZQUNkLGVBQWUsRUFBRSxlQUFlO1lBQ2hDLGVBQWUsRUFBRSxlQUFlO1NBQ25DLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxZQUFZLENBQUMsSUFBWTtRQUNyQixpQkFBaUI7UUFDakIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFNUIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQy9EO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsYUFBYSxDQUFDLElBQVksRUFDdEIsRUFBVSxFQUNWLGVBQW9DLEVBQ3BDLGdCQUFxQztRQUNyQyxnQkFBZ0I7UUFDaEIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFNUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQzNDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztRQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDdEQ7UUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDcEQ7UUFDRCxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztTQUNsRTtRQUNELGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRztZQUNsQixJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ2xCLGVBQWUsRUFBRSxlQUFlO1lBQ2hDLGdCQUFnQixFQUFFLGdCQUFnQjtTQUNyQyxDQUFDO1FBQ0YsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUs7UUFFRCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7U0FDdkQ7UUFFRCxhQUFhO1FBQ2IsTUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ25ELE1BQU0sY0FBYyxHQUFXLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztRQUU3RCxNQUFNLFdBQVcsR0FBc0QsRUFBRSxDQUFDO1FBQzFFLE1BQU0sT0FBTyxHQUEwQyxFQUFFLENBQUM7UUFFMUQsS0FBSyxNQUFNLEVBQUUsSUFBSSxjQUFjLEVBQUU7WUFDN0IsSUFBSSxjQUFjLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNuQyxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLFdBQVcsQ0FBQyxJQUFJLENBQUM7b0JBQ2IsSUFBSSxFQUFFLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO29CQUNoQixFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUU7aUJBQ2YsQ0FBQyxDQUFDO2dCQUVILElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtvQkFDdkIsT0FBTyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO2lCQUMvRDtnQkFDRCxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDeEIsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO2lCQUNoRTthQUNKO1NBQ0o7UUFFRCxLQUFLLE1BQU0sRUFBRSxJQUFJLFNBQVMsRUFBRTtZQUV4QixJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQzlCLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFNUIsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO29CQUN2QixPQUFPLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7aUJBQy9EO2dCQUNELElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtvQkFDdkIsT0FBTyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO2lCQUMvRDthQUNKO1NBQ0o7UUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2hDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQzNCLFFBQVEsQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBRTNCLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ2hGLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRWhGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUM7WUFDMUIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3JCLFdBQVcsRUFBRSxXQUFXO1lBQ3hCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLG1CQUFtQixFQUFFLElBQUksQ0FBQyxhQUFhLElBQUksbUJBQW1CO1NBQ2pFLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNILFlBQVksQ0FBQyxPQUEyQjtRQUNwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUNoRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztTQUMvQztRQUNELFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsV0FBVyxDQUFDLE9BQTJCO1FBQ25DLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1FBQ2hELElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhLENBQUMsT0FBMkI7UUFDckMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxZQUFZLENBQUMsT0FBMkI7UUFDcEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMzRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsRUFBRSxDQUFDLEVBQVU7UUFDVCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUUxQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUNuQixrRUFBa0U7WUFDbEUsa0NBQWtDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUN0QyxNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZGLGdEQUFnRDtRQUNoRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLEdBQUcsWUFBWSxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztTQUMvRTtRQUVELHVCQUF1QjtRQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWUsQ0FBQyxFQUFvQjtRQUNoQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUV4QixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxPQUFPO1FBQ0gsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUM1QixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIFByb3ZpZGVzIGEgY2xhc3MgcmVwcmVzZW50aW5nIGEgZmluaXRlIHN0YXRlIG1hY2hpbmUuXG4gKiBAYXV0aG9yIFhpYW9sb25nIFRhbmcgPHh4bG9uZ3RhbmdAZ21haWwuY29tPlxuICogQGxpY2Vuc2UgQ29weXJpZ2h0IEBtZVxuICovXG5pbXBvcnQgKiBhcyBkZXBlbmRlbmNpZXMgZnJvbSAnQHBvbHB3YXJlL2ZlLWRlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyByZXBsYWNlIGFzIHJlcGxhY2VTdHIgfSBmcm9tICdAcG9scHdhcmUvZmUtdXRpbGl0aWVzJztcblxuLy8gQSBzZXQgb2YgaGVscGVyIGZ1bmN0aW9uc1xuY29uc3QgXyA9IGRlcGVuZGVuY2llcy51bmRlcnNjb3JlO1xuY29uc3QgU3RhdGVNYWNoaW5lID0gZGVwZW5kZW5jaWVzWydzdGF0ZW1hY2hpbmUnXTtcbmNvbnN0IGluZGV4T2YgPSBfLmluZGV4T2Y7XG5jb25zdCB3aXRob3V0ID0gXy53aXRob3V0O1xuY29uc3QgdHJhbnNpdGlvbktleUZvcm1hdCA9ICd7ZnJvbX0ye3RvfSc7XG5jb25zdCBlcnJvck1lc3NhZ2VGb3JtYXQgPSAnVHJhbnNpdGlvbiB7bmFtZX0gZnJvbSB7ZnJvbX0gdG8ge3RvfSBmYWlscy4nO1xuXG5cbmZ1bmN0aW9uIGNhcHRpYWxpemUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZhbHVlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdmFsdWUuc2xpY2UoMSk7XG59XG5cbmludGVyZmFjZSBJVW5kZXJseUltcGwge1xuICAgIHN0YXRlOiBzdHJpbmc7XG4gICAgaXMoc3RhdGVOYW1lOiBzdHJpbmcpOiBib29sZWFuO1xuICAgIGNhbm5vdCh0cmFuc2l0aW9uTmFtZTogc3RyaW5nKTogYm9vbGVhbjtcbiAgICBmaXJlKHRyYW5zaXRpb25OYW1lOiBzdHJpbmcpOiBhbnk7XG59XG5cbmludGVyZmFjZSBJTGlmZUN5Y2xlRXZlbnQge1xuICAgIHRyYW5zaXRpb246IHN0cmluZztcbiAgICBmcm9tOiBzdHJpbmc7XG4gICAgdG86IHN0cmluZztcbn1cblxudHlwZSBNZXRob2RDYWxsYmFja1R5cGUgPSAoSUxpZmVDeWNsZUV2ZW50KSA9PiB2b2lkO1xudHlwZSBFcnJvckhhbmRsZXJUeXBlID0gKG5hbWU6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKSA9PiB2b2lkO1xuXG5pbnRlcmZhY2UgSVN0YXRlU3BlY2lmaWNhdGlvbiB7XG4gICAgb25FbnRlckNhbGxiYWNrPzogTWV0aG9kQ2FsbGJhY2tUeXBlO1xuICAgIG9uTGVhdmVDYWxsYmFjaz86IE1ldGhvZENhbGxiYWNrVHlwZTtcbn1cblxuaW50ZXJmYWNlIElUcmFuc2l0aW9uU3BlY2lmaWNhdGlvbiB7XG4gICAgZnJvbTogc3RyaW5nO1xuICAgIHRvOiBzdHJpbmc7XG4gICAgb25CZWZvcmVDYWxsYmFjaz86IE1ldGhvZENhbGxiYWNrVHlwZTtcbiAgICBvbkFmdGVyQ2FsbGJhY2s/OiBNZXRob2RDYWxsYmFja1R5cGU7XG59XG5cbi8qKlxuICogQnVpbGRzIGEgaGFuZGxlciB3aXRoIG5lY2Vzc2FyeSBjb250ZXh0IGluZm9ybWF0aW9uLlxuICogVGhlIHJlc3VsdGluZyByZXR1cm4gdmFsdWUgaXMgYSBjbG9zdXJlIGluZGVlZC5cbiAqL1xuZnVuY3Rpb24gYnVpbGRIYW5kbGVySW5DbG9zdXJlKGNvbnRleHQ6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8TWV0aG9kQ2FsbGJhY2tUeXBlPiB9LCBrZXk6IHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qgb3VySGFuZGxlcnMgPSBjb250ZXh0W2tleV07XG4gICAgICAgIGlmICghb3VySGFuZGxlcnMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91ckhhbmRsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gb3VySGFuZGxlcnNbaV07XG4gICAgICAgICAgICBmdW5jLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vKipcbiAqIERlZmF1bHQgZXJyb3IgaGFuZGxlciBmb3IgdGhlIEZTTS5cbiAqL1xuZnVuY3Rpb24gZGVmYXVsdEVycm9ySGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgaW5mbyA9IHJlcGxhY2VTdHIoZXJyb3JNZXNzYWdlRm9ybWF0LCB7XG4gICAgICAgIG5hbWU6IGV2ZW50TmFtZSxcbiAgICAgICAgZnJvbTogZnJvbSxcbiAgICAgICAgdG86IHRvXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coaW5mbyk7XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGZpbml0ZSBzdGF0ZSBtYWNoaW5lLlxuICogVGhlIHJlc3VsdGluZyBGU00gaXMgYnVpbHQgdXBvbiBhIGNvbW1vbmx5IHVzZWQgamF2YXNjcmlwdFxuICogc3RhdGUgbWFjaGluZSBsaWJyYXJ5LlxuICogU3VjaCBhIGRlc2lnbiAob2YgYXJjaGl0ZWN0dXJlKSBpcyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIGNvbnNpZGVyYXRpb25zOlxuICogLSBBIHVzZXItZnJpZW5kbHkgaW50ZXJmYWNlIGZvciBkZWZpbmluZyBzdGF0ZXMgYW5kIHRoZWlyIGJlaGF2aW9yc1xuICogLSBBIGtpbmQgb2YgbW9kZWwtY2hlY2tpbmcgY2FwYWJpbGl0eSBmb3IgdmVyaWZ5aW5nIHRoZSBjb3JyZWN0bmVzcyBvZlxuICogdHJhbnNpdGlvbnNcbiAqIC0gU3VwcG9ydCBmb3IgYXN5Y2hyb25vdXMgYW5kIHN5bmNocm91cyB0cmFuc2l0aW9uc1xuICogLSBTdXBwb3J0IGZvciBnbG9iYWwgZXhjZXB0aW9uIGhhbmRsaW5nXG4gKiBAY2xhc3MgRlNNXG4gKi9cbmV4cG9ydCBjbGFzcyBGaW5pdGVTdGF0ZU1hY2hpbmUge1xuXG4gICAgcHJpdmF0ZSBfaW1wbDogSVVuZGVybHlJbXBsO1xuICAgIHByaXZhdGUgX2luaXRTdGF0ZTogc3RyaW5nO1xuICAgIHByaXZhdGUgX2Vycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyVHlwZTtcbiAgICBwcml2YXRlIF9zdGF0ZUNvbmZpZ3VyYXRpb246IHsgW2tleTogc3RyaW5nXTogSVN0YXRlU3BlY2lmaWNhdGlvbiB9O1xuICAgIHByaXZhdGUgX3RyYW5zaXRpb25Db25maWd1cmF0aW9uOiB7IFtrZXk6IHN0cmluZ106IElUcmFuc2l0aW9uU3BlY2lmaWNhdGlvbiB9O1xuICAgIHByaXZhdGUgX2hhbmRsZXJzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PE1ldGhvZENhbGxiYWNrVHlwZT4gfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9pbXBsID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW5pdFN0YXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZXJyb3JIYW5kbGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc3RhdGVDb25maWd1cmF0aW9uID0ge307XG4gICAgICAgIHRoaXMuX3RyYW5zaXRpb25Db25maWd1cmF0aW9uID0ge307XG4gICAgICAgIHRoaXMuX2hhbmRsZXJzID0ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIEZTTSBpcyBpbiBjb25maWd1cmF0aW9uIHN0YWdlLlxuICAgICAqL1xuICAgIHByaXZhdGUgZW5zdXJlQ29uZmlndXJlU3RhZ2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbXBsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0YXRlIG1hY2hpbmUgaGFzIHN0YXJ0ZWQuJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgRlNNIGlzIGluIHJ1bm5pbmcgc3RhZ2UuXG4gICAgICovXG4gICAgcHJpdmF0ZSBlbnN1cmVSdW5uaW5nU3RhZ2UoKSB7XG4gICAgICAgIGlmICghdGhpcy5faW1wbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdGF0ZSBtYWNoaW5lIGhhcyBub3QgeWV0IHN0YXJ0ZWQuJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIHRoZSBiZWhhdmlvciB3aGVuIHRoZSBGU00gbW92ZXMgaW50byBhIHN0YXRlIGJ5IGEgdHJhbnNpdGlvbi5cbiAgICAgKi9cbiAgICBhZGRTdGF0ZShuYW1lOiBzdHJpbmcsXG4gICAgICAgIG9uRW50ZXJDYWxsYmFjaz86IE1ldGhvZENhbGxiYWNrVHlwZSxcbiAgICAgICAgb25MZWF2ZUNhbGxiYWNrPzogTWV0aG9kQ2FsbGJhY2tUeXBlKSB7XG4gICAgICAgIC8vIFByZS1jb25kaXRpb25zXG4gICAgICAgIHRoaXMuZW5zdXJlQ29uZmlndXJlU3RhZ2UoKTtcbiAgICAgICAgY29uc3Qgc3RhdGVDb25mID0gdGhpcy5fc3RhdGVDb25maWd1cmF0aW9uO1xuICAgICAgICBpZiAoc3RhdGVDb25mW25hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZGVmaW5lZCBzdGF0ZTogJyArIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlQ29uZltuYW1lXSA9IHtcbiAgICAgICAgICAgIG9uRW50ZXJDYWxsYmFjazogb25FbnRlckNhbGxiYWNrLFxuICAgICAgICAgICAgb25MZWF2ZUNhbGxiYWNrOiBvbkxlYXZlQ2FsbGJhY2tcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVmaW5lcyB0aGUgaW5pdCBzdGF0ZSBmb3IgdGhlIEZTTS5cbiAgICAgKi9cbiAgICBzZXRJbml0U3RhdGUobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIC8vIFByZS1jb25kaXRpb25zXG4gICAgICAgIHRoaXMuZW5zdXJlQ29uZmlndXJlU3RhZ2UoKTtcblxuICAgICAgICBpZiAodGhpcy5faW5pdFN0YXRlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZGVmaW5lZCBpbml0IHN0YXRlOiAnICsgdGhpcy5faW5pdFN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbml0U3RhdGUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIGEgbmV3IHN0cmFuc2l0aW9uLlxuICAgICAqL1xuICAgIGFkZFRyYW5zaXRpb24oZnJvbTogc3RyaW5nLFxuICAgICAgICB0bzogc3RyaW5nLFxuICAgICAgICBvbkFmdGVyQ2FsbGJhY2s/OiBNZXRob2RDYWxsYmFja1R5cGUsXG4gICAgICAgIG9uQmVmb3JlQ2FsbGJhY2s/OiBNZXRob2RDYWxsYmFja1R5cGUpIHtcbiAgICAgICAgLy8gUHJlLWNvbmRpdGlvblxuICAgICAgICB0aGlzLmVuc3VyZUNvbmZpZ3VyZVN0YWdlKCk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGVDb25mID0gdGhpcy5fc3RhdGVDb25maWd1cmF0aW9uO1xuICAgICAgICBjb25zdCB0cmFuc2l0aW9uQ29uZiA9IHRoaXMuX3RyYW5zaXRpb25Db25maWd1cmF0aW9uO1xuICAgICAgICBpZiAoIXN0YXRlQ29uZltmcm9tXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmRlZmluZWQgc291cmNlIHN0YXRlOiAnICsgZnJvbSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzdGF0ZUNvbmZbdG9dKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZGVmaW5lZCB0YXJnZXQgc3RhdGU6ICcgKyB0byk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qga2V5ID0gcmVwbGFjZVN0cih0cmFuc2l0aW9uS2V5Rm9ybWF0LCB7IGZyb206IGZyb20sIHRvOiB0byB9KTtcbiAgICAgICAgaWYgKHRyYW5zaXRpb25Db25mW2tleV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmVkZWZpbmVkIHRyYW5zaXRpb246ICcgKyBmcm9tICsgJyAtPiAnICsgdG8pO1xuICAgICAgICB9XG4gICAgICAgIHRyYW5zaXRpb25Db25mW2tleV0gPSB7XG4gICAgICAgICAgICBmcm9tOiBmcm9tLCB0bzogdG8sXG4gICAgICAgICAgICBvbkFmdGVyQ2FsbGJhY2s6IG9uQWZ0ZXJDYWxsYmFjayxcbiAgICAgICAgICAgIG9uQmVmb3JlQ2FsbGJhY2s6IG9uQmVmb3JlQ2FsbGJhY2tcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIHRoZSBGU00uIE5vdGUgdGhhdCB0aGlzIG1ldGhvZCBtdXN0IGJlIGludm9rZWQgYmVmb3JlXG4gICAgICogYW55IG1ldGhvZCB3aGljaCBtYXkgY2hhbmdlIHRoZSBzdGF0ZSBvZiB0aGUgRlNNLlxuICAgICAqL1xuICAgIHN0YXJ0KCkge1xuXG4gICAgICAgIHRoaXMuZW5zdXJlQ29uZmlndXJlU3RhZ2UoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0U3RhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5pdCBzdGF0ZSBoYXMgbm90IGJlZW4gZGVmaW5lZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlZmluaXRpb25cbiAgICAgICAgY29uc3Qgc3RhdGVDb25mOiBPYmplY3QgPSB0aGlzLl9zdGF0ZUNvbmZpZ3VyYXRpb247XG4gICAgICAgIGNvbnN0IHRyYW5zaXRpb25Db25mOiBPYmplY3QgPSB0aGlzLl90cmFuc2l0aW9uQ29uZmlndXJhdGlvbjtcblxuICAgICAgICBjb25zdCB0cmFuc2l0aW9uczogQXJyYXk8eyBuYW1lOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBjb25zdCBtZXRob2RzOiB7IFtrZXk6IHN0cmluZ106IE1ldGhvZENhbGxiYWNrVHlwZSB9ID0ge307XG5cbiAgICAgICAgZm9yIChjb25zdCBrMSBpbiB0cmFuc2l0aW9uQ29uZikge1xuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb25Db25mLmhhc093blByb3BlcnR5KGsxKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gdHJhbnNpdGlvbkNvbmZbazFdO1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBrMSxcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogZWxlbTEuZnJvbSxcbiAgICAgICAgICAgICAgICAgICAgdG86IGVsZW0xLnRvXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZWxlbTEub25BZnRlckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbJ29uQWZ0ZXInICsgY2FwdGlhbGl6ZShrMSldID0gZWxlbTEub25BZnRlckNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZWxlbTEub25CZWZvcmVDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2RzWydvbkJlZm9yZScgKyBjYXB0aWFsaXplKGsxKV0gPSBlbGVtMS5vbkFmdGVyQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBrMiBpbiBzdGF0ZUNvbmYpIHtcblxuICAgICAgICAgICAgaWYgKHN0YXRlQ29uZi5oYXNPd25Qcm9wZXJ0eShrMikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtMiA9IHN0YXRlQ29uZltrMl07XG5cbiAgICAgICAgICAgICAgICBpZiAoZWxlbTIub25FbnRlckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbJ29uRW50ZXInICsgY2FwdGlhbGl6ZShrMildID0gZWxlbTIub25FbnRlckNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZWxlbTIub25MZWF2ZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbJ29uTGVhdmUnICsgY2FwdGlhbGl6ZShrMildID0gZWxlbTIub25MZWF2ZUNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0gdGhpcy5faGFuZGxlcnM7XG4gICAgICAgIGhhbmRsZXJzLm9uRW50ZXJTdGF0ZSA9IFtdO1xuICAgICAgICBoYW5kbGVycy5vbkxlYXZlU3RhdGUgPSBbXTtcblxuICAgICAgICBtZXRob2RzWydvbkVudGVyU3RhdGUnXSA9IGJ1aWxkSGFuZGxlckluQ2xvc3VyZSh0aGlzLl9oYW5kbGVycywgJ29uRW50ZXJTdGF0ZScpO1xuICAgICAgICBtZXRob2RzWydvbkxlYXZlU3RhdGUnXSA9IGJ1aWxkSGFuZGxlckluQ2xvc3VyZSh0aGlzLl9oYW5kbGVycywgJ29uTGVhdmVTdGF0ZScpO1xuXG4gICAgICAgIHRoaXMuX2ltcGwgPSBuZXcgU3RhdGVNYWNoaW5lKHtcbiAgICAgICAgICAgIGluaXQ6IHRoaXMuX2luaXRTdGF0ZSxcbiAgICAgICAgICAgIHRyYW5zaXRpb25zOiB0cmFuc2l0aW9ucyxcbiAgICAgICAgICAgIG1ldGhvZHM6IG1ldGhvZHMsXG4gICAgICAgICAgICBvbkludmFsaWRUcmFuc2l0aW9uOiB0aGlzLl9lcnJvckhhbmRsZXIgfHwgZGVmYXVsdEVycm9ySGFuZGxlclxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGEgaGFuZGxlciBmb3IgZW50ZXJzdGF0ZVxuICAgICAqL1xuICAgIG9uRW50ZXJTdGF0ZShoYW5kbGVyOiBNZXRob2RDYWxsYmFja1R5cGUpIHtcbiAgICAgICAgY29uc3Qgb3VySGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVycy5vbkVudGVyU3RhdGU7XG4gICAgICAgIGlmIChpbmRleE9mKG91ckhhbmRsZXJzLCBoYW5kbGVyKSA+PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlLXJlZ2lzdGVyaW5nIGEgaGFuZGVyIScpO1xuICAgICAgICB9XG4gICAgICAgIG91ckhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIGhhbmRsZXIgZm9yIGV4aXRzdGF0ZVxuICAgICAqL1xuICAgIG9uRXhpdFN0YXRlKGhhbmRsZXI6IE1ldGhvZENhbGxiYWNrVHlwZSkge1xuICAgICAgICBjb25zdCBvdXJIYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzLm9uTGVhdmVTdGF0ZTtcbiAgICAgICAgaWYgKGluZGV4T2Yob3VySGFuZGxlcnMsIGhhbmRsZXIpID49IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmVnaXN0ZXJpbmcgYSBoYW5kZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgb3VySGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW4tcmVnaXN0ZXIgYSBoYW5kbGVyIGZvciBlbnRlcnN0YXRlXG4gICAgICovXG4gICAgb2ZmRW50ZXJTdGF0ZShoYW5kbGVyOiBNZXRob2RDYWxsYmFja1R5cGUpIHtcbiAgICAgICAgY29uc3Qgb3VySGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVycy5vbkVudGVyU3RhdGU7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJzLm9uZW50ZXJzdGF0ZSA9IHdpdGhvdXQob3VySGFuZGxlcnMsIGhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbi1yZWdpc3RlciBhIGhhbmRsZXIgZm9yIGV4aXRzdGF0ZVxuICAgICAqL1xuICAgIG9mZkV4aXRTdGF0ZShoYW5kbGVyOiBNZXRob2RDYWxsYmFja1R5cGUpIHtcbiAgICAgICAgY29uc3Qgb3VySGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVycy5vbkxlYXZlU3RhdGU7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJzLm9uZXhpdHN0YXRlID0gd2l0aG91dChvdXJIYW5kbGVycywgaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgdHJhbnNpdGlvbiB0byB0aGUgZ2l2ZW4gc3RhdGUuXG4gICAgICogVGhpcyBtZXRob2QgYWxzbyB2YWxpZGF0ZSB0aGUgdHJhbnNpdGlvbi5cbiAgICAgKi9cbiAgICBnbyh0bzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuZW5zdXJlUnVubmluZ1N0YWdlKCk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGVDb25mID0gdGhpcy5fc3RhdGVDb25maWd1cmF0aW9uO1xuICAgICAgICBpZiAoIXN0YXRlQ29uZlt0b10pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR28gdG8gdW5kZWZpbmVkIHN0YXRlOiAnICsgdG8pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pbXBsLmlzKHRvKSkge1xuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHVuZGVybHlpbmcgaW1wbGVtZW50YXRpb24gdGFrZXMgaW50byBhY2NvdW50XG4gICAgICAgICAgICAvLyBtb3ZpbmcgZnJvbSBvbmUgc3RhdGUgdG8gaXRzZWxmXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSB0aGlzLl9pbXBsLnN0YXRlO1xuICAgICAgICBjb25zdCB0cmFuc2l0aW9uTmFtZSA9IHJlcGxhY2VTdHIodHJhbnNpdGlvbktleUZvcm1hdCwgeyBmcm9tOiBjdXJyZW50U3RhdGUsIHRvOiB0byB9KTtcbiAgICAgICAgLy8gVmFsaWRhdGUgaWYgdGhpcyB0cmFuc2l0aW9uIGlzIGFsbG93ZWQgb3Igbm90XG4gICAgICAgIGlmICh0aGlzLl9pbXBsLmNhbm5vdCh0cmFuc2l0aW9uTmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHJhbnNpdGlvbiBpcyBub3QgYWxsb3dlZDogJyArIGN1cnJlbnRTdGF0ZSArICcgLT4gJyArIHRvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEludm9rZSB0aGlzIGZ1bmN0aW9uXG4gICAgICAgIGNvbnN0IGZ1bmMgPSB0aGlzLl9pbXBsW3RyYW5zaXRpb25OYW1lXTtcbiAgICAgICAgZnVuYy5jYWxsKHRoaXMuX2ltcGwpO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyB0aGUgZXJyb3IgaGFuZGxlciBmb3IgdGhlIEZTTS5cbiAgICAgKi9cbiAgICBhZGRFcnJvckhhbmRsZXIoZm46IEVycm9ySGFuZGxlclR5cGUpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVDb25maWd1cmVTdGFnZSgpO1xuXG4gICAgICAgIHRoaXMuX2Vycm9ySGFuZGxlciA9IGZuO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc3RhdGUuXG4gICAgICovXG4gICAgY3VycmVudCgpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVSdW5uaW5nU3RhZ2UoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ltcGwuc3RhdGU7XG4gICAgfVxufVxuIl19