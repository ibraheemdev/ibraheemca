---
template: post
title: Easier Async State in React + Redux with Finite State Machines
slug: fsm-react-redux
draft: true
date: 2020-07-16T19:17:26.879Z
description: Implementing the Finite State Machine Model with Reactjs and Redux
  for easier asynchronous state modelling
category: reactjs
tags:
  - reactjs
  - redux
  - state-management
---
*Much of this post was based on [Infinitely Better UIs with Finite Automata](https://www.youtube.com/watch?v=VU1NKX6Qkxc), a talk by David Khourshid, the creator of [xstate](https://github.com/davidkpiano/xstate) and [Solving the Boolean Identity Crisis](https://www.youtube.com/watch?v=6TDKHGtAxeg) by Jeremy Fairbank at elm-conf 2017.*

**The Problem**

When developing a react + redux application, you often have to load data from a remote source, usually a REST API. Let's say you have a todo list application. When a user clicks 'add todo', you dispatch the corresponding 'ADD_TODO' action. If the response is OK, you dispatch the success action, and if the request fails, you dispatch the failure action:

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

 Simple, right? But wait, we want to display a spinner if while the request is taking place. We also need a way to tell the view that the request is successful or failed so that is can display the correct message. This seems like a good candidate for boolean flags, like `isLoading` and `isSuccessful`. 

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

Furthermore, most applications aren't that simple. What if we want to have other booleans, like `isAuthorized`, and `isPayingCustomer`?

```ruby
if isPayingCustomer
  if not isLoading
    if isEditor or isAdmin and isLoggedIn
      ...
    else if not isAuthorized
      ...
    else
      ...
  else if isLoading
    ...
else ifGuestAccount
  ...
```

And all of this is assuming that you, the developer, doesn't make a mistake and write `isAuthorized` instead of `!isAuthorized`, and accidentally leave a gaping security hole in your app.

![Person Shrugging on Twitter Twemoji](https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/259/person-shrugging_1f937.png)

**What is a Finite State Machine?**

In computer science, there is a computational model known as a "finite state machine". It is an abstract machine, whether a software system or computer hardware. There are two types of state machines, deterministic, and non-deterministic. The former, the one we will be working with, has the following constraints:

1. Has a finite number of states (`idle`, `loading`, `successful`, `failure`, etc.)
2. Has a finite number of actions (`ADD_TODO`, `DELETE_TODO`, etc.)
3. Has an initial state (`idle`) and a final state (not applicable to our app)
4. Transitions between states in response to an action (`loading` + `ADD_TODO_SUCCESS` = `successful`). Given the current state, and an action, a deterministic FSM will always return the same next state
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

*emojis courtesy of [Twemoji](https://twemoji.twitter.com/)*