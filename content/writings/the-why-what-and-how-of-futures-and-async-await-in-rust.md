---
template: writing.html
title: The Why, What and How of Futures and async/await in Rust
slug: futures-and-async-await-in-rust
draft: true
date: 2020-11-28T17:47:12.906Z
description: Futures are Rust's way of expressing asynchronous computations, but even after reading the documentation, it can be hard to figure out how all the pieces of futures (and tokio) fit together. While this may not matter too much if you're just using futures, it becomes a stumbling block once you want to implement asynchronous primitives yourself. The async and await keywords greatly reduce the friction of writing and using asynchronous code, but add even more to the mystery of how this stuff all works.

taxonomies:
    tags:
        - Rust
        - Asynchronous
        - Crust of Rust

extra:
    socialImage: /rust-logo.png
---

### Introduction

Today, we are going to tackle futures and async/await in Rust. The point of this post is not to teach you how to write asynchronous code, but instead about how futures and async/await work internally in the language, what the libraries are like, and how all the pieces fit together. We are going to look at futures, tokio - which is the most popular executors for futures today, pinning, and then finally we will cover the async/await syntax. This post hopes to be a complete and thorough overview of the asynchronous ecosystem in Rust.

### Futures

The idea behind futures is that we want some way to express a value that is not yet ready. This is similar to promises in Javascript or Scala. A future represents an operation that hasn't completed yet, but _promises_ a value at some point in the _future_. Futures are a building block for concurrent (asynchronous) operations. They are useful in compute heavy applications, as well as network operations. For example, you might have a program that is connecting to two TCP servers:

```rust
let x = TcpStream::connect("127.0.0.1");
let y = TcpStream::connect("127.0.0.1");
```

Writing to both servers:

```rust
x.write("foobar");
y.write("foobar");
```

And reading from them:

```rust
assert_eq!(x.read(), "barfoo");
assert_eq!(y.read(), "barfoo");
```

The way the program is layed out write now, each line of code will be executed synchronously:

```rust
// connect to the first server
let x = TcpStream::connect("127.0.0.1");

// wait for the first connection to succeed, and then connect to the second server
let y = TcpStream::connect("127.0.0.1");

// wait for the second connection to succeed, and then write to the first server
x.write("foobar");

// and so on...
```

The program works, but a lot of the time it is just waiting for the previous operation to succeed, instead of working on the next one. Why not connect to both servers at the same time? We could improve this code by making it multi-threaded:

```rust
let thread_x = thread::spawn(|| {
  let x = TcpStream::connect("127.0.0.1")
  x.write("foobar");
  return x.read();
};

let thread_y = thread::spawn(|| {
  let y = TcpStream::connect("127.0.0.1")
  y.write("foobar");
  return y.read();
};

assert_eq!(thread_x.join().unwrap(), "barfoo");
assert_eq!(thread_y.join().unwrap(), "barfoo");
```

This works fine for many applications. After all, threads were designed to do just this: run multiple different tasks at once. However, they also come with some limitations. There's a lot of overhead involved in the process of switching between different threads and sharing data between threads. Even a thread which just sits and does nothing uses up valuable system resources. These are the costs that asynchronous code is designed to eliminate. In a futures based world, the program would look more like this:

```rust
let fut_x = TcpStream::connect("127.0.0.1")
  .and_then(|x| x.write("foobar"))
  .and_then(|x| x.read())
  .and_then(|b| Ok(b == "barfoo"))

let fut_y = TcpStream::connect("127.0.0.1")
  .and_then(|x| x.write("foobar"))
  .and_then(|x| x.read())
  .and_then(|b| Ok(b == "barfoo"))
```

Each one of the operations returns a `future`. If you tried to print the value of `fut_x` to the console, you would not see a boolean like you might expect. Instead, you would get an error that looks like this:

```rust
error[E0277]: `impl Future` doesn't implement `std::fmt::Display`
 --> src/main.rs:6:18
  |
6 |   println!("{}", fut_x)
  |                  ^^^^^^ `impl Future` cannot be formatted with the default formatter
```

At this point, `fut_x` is not a boolean. Instead, it is a future representing an operation that will _eventually_ return a boolean. This is what we mean by an asynchronous computation:

> A future is a value that may not have finished computing yet. This kind of "asynchronous value" makes it possible for a thread to continue doing useful work while it waits for the value to become available.

You can think as a future as a description of an operation. None of the steps have finished yet, actually, they may not have even started. So if a `future` is a description of an operation, what actually runs it? This is where an executor comes in:

```rust
let a: Executor = Executor::new();

let x = a.run(fut_x);
assert!(x);

let y = a.run(fut_y);
assert!(y);
```

An executor handles running a future to completion. But how is the code above different from what we had in the beginning? We are still running the first future, waiting for it to finish, and then running the next future. Instead of executing each future synchronously, we tell the executor to spawn a new `task` for each future:

```rust
let a: Executor;

a.spawn(fut_x.and_then(|eq| Ok(assert!(eq))));
a.spawn(fut_y.and_then(|eq| Ok(assert!(eq))));
a.run();
```

An asynchronous task will handle running the futures in the background. Tasks are prioritized by the executor depending on whether the future is ready to perform more computations. When the future is ready, the executor runs the `and_then`, passing in the result. If the future isn't ready, the executor can run a different future. If that future needs to wait for a different asynchronous operation, the executor moves to a new future. So how does the executor keep track of which futures are ready or not? We can start by looking at the [`Future`](https://doc.rust-lang.org/beta/std/future/trait.Future.html) trait from the standard library.

### The `Future` Trait

```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

Every future has an `Output`, which represents the value that the future will return once it is complete. All of the magic of futures happens in the `poll` method. The poll method returns a `Poll` containing the `Output`. So what is `Poll`?

```rust
pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

`Poll` is an enum that has two states: `Ready` or `Pending`, which represents that a value is not ready yet. The `poll` function returns:

- `Poll::Pending` if the future is not ready yet
- `Poll::Ready(val)` with the result `val` of this future if it finished successfully.

Futures can be advanced by calling the `poll` function, which will drive the future as far towards completion as possible. If the future completes, it returns `Poll::Ready(result)`. If the future is not able to complete yet, it returns `Poll::Pending`. The executor is responsible for polling futures and prioritizing them based on which ones are ready to make progess. Once the future is ready to make more progress, it alerts the executor throught the `Context`, and the executor driving the `Future` will call `poll` again so that the `Future` can make more progress.

To help get a better understanding of the proccess of polling futures to completion, let's try implementing a simple executor ourselves.

### A Simple Executor

To make our executor as simple as possible, let's aim for a simple API like this:
```rust
let xy = a.run_all(vec![fut_x, fut_y]);
```

We can start off with a struct called `Executor` that has the `run_all` function:
```rust
struct Executor;

impl Executor {
  fn run(&mut self, futures: Vec<Future>) -> Vec<Future::Output>) {
    let mut results = Vec::new();
    let mut done = 0;

    while done != futures.len() {
      for (i, f) in &mut futures.iter_mut().enumerate() {
        // ...
      }
    }

    return results;
  }
}
```
We loop through the `futures` until they are all `done`. Now, the behavior of `run` depends on the state of the current future. We can access the future's state by `polling` it:
```rust
for (i, f) in &mut futures.iter_mut().enumerate() {
  match f.poll() {
    // ...
  }
}
```

If the future is ready, then we now have access to the future's `Output`. We can store the output in the `results` vector and mark the future as `done`:
```rust
match f.poll() {
  Poll::Ready(val) => {
    results.push(val);
    done += 1;
  }
}
```

If the future is not ready, then it still has more work to do. We can leave this future for now:
```rust
match f.poll() {
  Poll::Pending => {
    continue;
  }
}
```

Here is the complete function:
```rust
fn run_all(&mut self, futures: Vec<Future>) -> Vec<Future::Output> {
  let mut results = Vec::new();
  let mut done = 0;

  while done != futures.len() {
    for (i, f) in &mut futures.iter_mut().enumerate() {
      match f.poll() {
         Poll::Ready(val) => {
          results.push(val);
          done += 1;
        },
        Poll::Pending => continue;
      }
    }
  }

  return results;
}
```

For each future in the `futures` parameter, we `poll` it. If the future is still `Pending`, then we leave it for now and move on to `poll` other futures. If the future is `Ready` (it finshed all of its work), then we store the result and mark it as `done`. Once all the futures are done, we can return the `results`. Make sense? 

This basic executor is non-blocking. This setup allows us to handle many computations efficiently. Instead of having 1000 threads that spend most of their time waiting for external io, we now have one thread that works on whatever is ready.

The `run_all` function right now is broken in many ways, but it gives you a basic idea of how futures work. For example, what happens if there is only one future left?
```rust
while done != futures.len() {
  match f.poll() {
    // the future is not done
    Poll::Pending => continue;
  }
  // come back the the same future again
}
```
Here, we have a very inefficient busy loop. We need some way of getting scheduling future tasks. This is where `Context` comes in.

### A Better `Executor`

Imagine a future that is waiting for a timer. You `poll` it until it finishes all the work it can do until it now is just waiting for the timer, and it returns `Poll::Pending`. The future does not have anything to do until it's timer finishes, so it can just go to sleep. Now we need a different source to register that the Future is waiting for an event to happen, and make sure that the Future wakes up when the event (the timer) is ready.
