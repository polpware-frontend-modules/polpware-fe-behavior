declare type MethodCallbackType = (ILifeCycleEvent: any) => void;
declare type ErrorHandlerType = (name: string, from: string, to: string) => void;
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
export declare class FiniteStateMachine {
    private _impl;
    private _initState;
    private _errorHandler;
    private _stateConfiguration;
    private _transitionConfiguration;
    private _handlers;
    constructor();
    /**
     * Checks if FSM is in configuration stage.
     */
    private ensureConfigureStage;
    /**
     * Checks if FSM is in running stage.
     */
    private ensureRunningStage;
    /**
     * Defines the behavior when the FSM moves into a state by a transition.
     */
    addState(name: string, onEnterCallback?: MethodCallbackType, onLeaveCallback?: MethodCallbackType): this;
    /**
     * Defines the init state for the FSM.
     */
    setInitState(name: string): this;
    /**
     * Defines a new stransition.
     */
    addTransition(from: string, to: string, onAfterCallback?: MethodCallbackType, onBeforeCallback?: MethodCallbackType): this;
    /**
     * Starts the FSM. Note that this method must be invoked before
     * any method which may change the state of the FSM.
     */
    start(): this;
    /**
     * Registers a handler for enterstate
     */
    onEnterState(handler: MethodCallbackType): this;
    /**
     * Registers a handler for exitstate
     */
    onExitState(handler: MethodCallbackType): this;
    /**
     * Un-register a handler for enterstate
     */
    offEnterState(handler: MethodCallbackType): this;
    /**
     * Un-register a handler for exitstate
     */
    offExitState(handler: MethodCallbackType): this;
    /**
     * Performs a transition to the given state.
     * This method also validate the transition.
     */
    go(to: string): Window | this;
    /**
     * Provides the error handler for the FSM.
     */
    addErrorHandler(fn: ErrorHandlerType): this;
    /**
     * Returns the current state.
     */
    current(): string;
}
export {};
