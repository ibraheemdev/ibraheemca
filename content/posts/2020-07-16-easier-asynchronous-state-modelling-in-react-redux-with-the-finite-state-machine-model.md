---
template: post
title: Easier Async State in React + Redux with Finite State Machines
slug: fsm-react-redux
draft: false
date: 2020-07-16T19:17:26.879Z
description: Implementing the Finite State Machine Model with Reactjs and Redux
  for easier asynchronous state modelling
category: React.js
tags:
  - React.js
  - Redux
---
*Much of this post was based on [Infinitely Better UIs with Finite Automata](https://www.youtube.com/watch?v=VU1NKX6Qkxc), a talk by David Khourshid, the creator of [xstate](https://github.com/davidkpiano/xstate) and [Solving the Boolean Identity Crisis](https://www.youtube.com/watch?v=6TDKHGtAxeg) by Jeremy Fairbank at elm-conf 2017.*

**The Problem**

When developing a react + redux application, you often have to load data from a remote source, usually a REST API. Let's say you have a todo list application. When a user clicks 'add todo', you dispatch the corresponding `ADD_TODO` action. If the response is OK, you dispatch the success action, and if the request fails, you dispatch the failure action:

```javascript
const handleClick = () => {
  // request started
  dispatch({ type: ADD_TODO })
  axios.post('api.myapp.com/todos', { title: state.newTodoTitle })
  .then(res => {
    // successful request
    dispatch({ type: ADD_TODO_SUCCESS, payload: res.data.todo })
  })
  .catch(res => {
    // request failed
    dispatch({ type: ADD_TODO_FAILURE, payload: res.data.errors })
  })
}
```

Now, we have to implement the reducer that will handle the dispatched actions.

```javascript
const TodosReducer = (state = {}, action) => {
  switch(action.type) {
    case ADD_TODO:
      return {
        ...state,
        errors: [],
        todos: []
      }
    case ADD_TODO_FAILURE:
      return {
        ...state,
        errors: [ ...action.payload ],
        todos: []
      }
    case ADD_TODO_SUCCESS:
      return {
        ...state,
        errors: [],
        todos: [ ...state.todos, action.payload ]
      }
  }
}
```

 Simple, right? But wait, we want to display a spinner if while the request is taking place. We also need a way to tell the view that the request was successful or failed, so that is can display the correct message to the user. This seems like a good candidate for boolean flags like `isLoading` and `isSuccessful`. 

```javascript
const TodosReducer = (state = {}, action) => {
  switch(action.type) {
    case ADD_TODO:
      return {
        ...state, 
        isLoading: true,
        isError: false,
        isSuccessful: false,
        errors: [],
        todos: []
      }
    case ADD_TODO_FAILURE:
      return {
        ...state, 
        isLoading: false, 
        isError: true,
        isSuccessful: false,
        errors: [ ...action.payload ],
        todos: []
      }
    case ADD_TODO_SUCCESS:
      return {
        ...state, 
        isLoading: false, 
        isError: false,
        isSuccessful: true,
        errors: [],
        todos: [ ...state.todos, action.payload ]
      }
  }
}
```

The above code makes sense. If the request was successful, then we should update `isSuccessful` to be true. If it is loading, then `isLoading` should be true, and so on. Now, let's try using the todo state in our view.

```javascript
return (
  ...
  {state.isError && !state.isLoading && 
    <ErrorWrapper errors={state.errors} />
  }
  {state.isLoading && !state.isError && 
    <LoadingSpinner />
  }
  {state.isSuccessful && todos &&
    <TodosList todos={state.todos} />
  }
)
```

Things just got a whole lot more complicated... The view code is messy and unclear. No one wants a string of if statements in their render function. And what if a user does something unexpected, and the state ends up looking like this:

```javascript
return {
  isLoading: true, 
  isError: true,
  isSuccessful: true,
  errors: [ {id: 1, title: "my first todo "} ],
  todos: [ "An unexpected error occurred" ]
}
```

How can a request be loading, have errors, and be successful at the same time???

Furthermore, most applications aren't that simple. What if we want to have other features, like disabling actions after a timeout?

```ruby
if isTimedOut
  if not isLoading
    if isError
      ...
    else if not isError and isSuccessful
      ...
    else
      ...
  else if isLoading
    ...
else ifTimeout < 3000
  ...
```

![Person Shrugging on Twitter Twemoji](https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/259/person-shrugging_1f937.png)

**What is a Finite State Machine?**

In computer science, there is a computational model known as a "finite state machine". It is an abstract machine, whether a software system or computer hardware. There are two types of state machines, deterministic: and non-deterministic. The former, the one we will be working with, has the following constraints:

1. Has a finite number of states (`idle`, `loading`, `successful`, `failure`, etc.)
2. Has a finite number of actions (`ADD_TODO`, `DELETE_TODO`, etc.)
3. Has an initial state (`idle`) and a final state (not applicable to our app)
4. Transitions between states in response to an action: <br/>(`loading` + `ADD_TODO_SUCCESS` = `successful`). <br/>Given the current state, and an action, a deterministic FSM will always return the same next state
5. Can and will only be in **one** of its finite number of states at any given time.

For more on finite state machines, see [this article](https://brilliant.org/wiki/finite-state-machines/)

**Modelling the Finite State Machine**

To model your applications FSM, you can simple fill out the 5 constraints of a deterministic state machines.

Our application has 4 possible states, the initial one being `IDLE`.

![the 4 possible states of our application: (idle, loading, successful, failure)](/media/group-6.png)

Our app also has 3 actions:

* `ADD_TODO`
* `ADD_TODO_SUCCESS`
* `ADD_TODO_FAILURE`

Now we have to determine all the transitions that our app can go through. We can do this using a flow chart:

![The application transitions](/media/group-10.png)

As you can see, the todo-list app is quite simple. It starts at the `IDLE` state. When a user adds a todo, it transitions to `LOADING`. The request returns either as a `SUCCESS`, or a `FAILURE`. If the user adds another todo, the app goes back to the `LOADING` state, and so on.

**Implementing the Finite State Machine**

Now that our state machine is modelled, we can actually implement it in our application. The entire application state can be represented through one frozen (non-editable) object:

```javascript
const stateMachine = Object.freeze({
  idle: { 
    ADD_TODO: 'loading' 
  },
  loading: { 
    ADD_TODO_SUCCESS: 'successful' 
    ADD_TODO_FAILURE: 'failure' 
  },
  failure: {
    ADD_TODO: 'loading' 
  },
  successful: {
    ADD_TODO: 'loading' 
  }
})
```

As you can see, the `stateMachine` is just an object representation of our flow chart. Now, we can create a transition function. The transition function will implement the fourth constraint of deterministic FSM's: 

> Transitions between states in response to an action: <br/>(`loading` + `ADD_TODO_SUCCESS` = `successful`). <br/>Given the current state, and an action, a deterministic FSM will always return the same next state

The function looks like this:

```javascript
const transition = (currentState, action) => {
  return stateMachine[currentState][action]
}

// The current state of the application is 'idle'
// The user clicks 'Add Todo', dispatching the ADD_TODO action
// If we look at the stateMachine object, we can see that the
// corresponding state is 'loading'

transition('idle', ADD_TODO)
// => 'loading'

// And sure enough, our function works!
```

Now for the coolest part. If you haven't already noticed, the transition function *is* a reducer! 

> The reducer is a pure function that takes the previous state and an action, and returns the next state. - [redux.js.org](https://redux.js.org/basics/reducers)

And that is exactly what our function does. With a few modifications, we can convert it into a redux style reducer:

```javascript
const TransitionReducer = (state = { status: 'idle' }, action) => {
  return { status: stateMachine[state.status][action.type] }
}
```

That's it! in 3 lines of code, we can intercept all actions, and calculate the application state based on the current state, and the action type! Our todos reducer and view now look much cleaner:

```javascript
// reducer
const TodosReducer = (state = {}, action) => {
  switch(action.type) {
    case ADD_TODO_FAILURE:
      return {
        ...state,
        errors: [ ...action.payload ]
      }
    case ADD_TODO_SUCCESS:
      return {
        ...state,
        errors: [],
        todos: [ ...state.todos, action.payload ]
      }
  }
}
```

```javascript
// view
return (
  ...
  {state.status === 'failure' && <ErrorWrapper errors={state.errors} />}
  {state.status === 'loading' && <LoadingSpinner />}
  {state.status === 'successful' && <TodosList todos={state.todos} />}
)
```

**Takeaways:**

The biggest gain from this pattern, is that no matter what the user does, our application will always be in one of 4 predetermined states. It also brings single purpose reducers, reducers that handle one process and one process only. Those two combined give simplicity to the entire application: reducers, views, and actions.

*shrug emoji courtesy of [Twemoji](https://twemoji.twitter.com/)*