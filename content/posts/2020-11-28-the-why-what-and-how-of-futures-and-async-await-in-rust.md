---
template: post
title: The Why, What and How of Futures and async/await in Rust
slug: futures-and-async-await-in-rust
socialImage: /media/rust-logo.png
draft: true
date: 2020-11-28T17:47:12.906Z
description: Futures are Rust's way of expressing asynchronous computations, 
but even after reading the documentation, it can be hard to figure out how 
all the pieces of futures (and tokio) fit together. While this may not matter 
too much if you're just *using* futures, it becomes a stumbling block once you 
want to implement asynchronous primitives yourself. The highly anticipated 
async and await keywords that are coming down the pike promise to greatly 
reduce the friction of writing and using asynchronous code, but add even more 
to the mystery of how this stuff all works.

mainTag: Rust
tags:
  - Rust
  - Asynchronous
  - Crust of Rust
---

### Introduction

Today, we are going to tackle futures and async/await in Rust. The point of this post is not to teach you how to write asynchronous code, but instead about how futures and async/await work internally in the language, what the libraries are like, and how all the pieces fit together. We are going to look at futures, tokio - which is the most popular executors for futures today, pinning, and then finally we will cover the async/await syntax. This post hopes to be a complete and thorough overview of the asynchronous ecosystem in Rust.

### Futures

The idea behind futures is that we want some way to express a value that is not yet ready. This is similar to promises in Javascript or Scala. At a very high level you could think of futures as a building block for concurrent operations. For example, you might have a program that is connecting to two tcp servers:
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

The program works, but alot of the time it is just waiting for the previous operation to succeed, instead of working on the next one. Why not connect to both servers at the same time? We could improve this code by making it multi-threaded:
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
  .and_then(|c, b| assert_eq!(b, "barfoo"))

let fut_y = TcpStream::connect("127.0.0.1")
  .and_then(|x| x.write("foobar"))
  .and_then(|x| x.read())
  .and_then(|c, b| assert_eq!(b, "barfoo"))
```

Each one of the operations returns a `future`. If you tried to print the value of `fut_x` to the console, you would not see a boolean like you might expect. Instead, you would get an error that looks like this:
```rust
error[E0277]: `impl Future` doesn't implement `std::fmt::Display`
 --> src/main.rs:6:18
  |
6 |   println!("{}", fut_x)
  |                  ^^^^^^ `impl Future` cannot be formatted with the default formatter
```

At this point, `fut_x` is not a boolean. Instead, it is a future representing an operation that will *eventually* return a boolean. This is what we mean by asynchronous computations:

> A future is a value that may not have finished computing yet. This kind of "asynchronous value" makes it possible for a thread to continue doing useful work while it waits for the value to become available.

You can think as a future as a description of an operation. None of the steps have finished yet, actually, they may not have even started. This is where an executor comes in. An executor takes a set of futures and handles executing them at an appropriate time:

```rust
let a: Executor;

a.spawn(fut_x.and_then(|eq| assert!(eq)));
a.spawn(fut_y.and_then(|eq| assert!(eq)));
a.block_on_all();
```

Now, instead of executing the task synchronously, we tell the executor to spawn a new asynchronous task that will handle running the futures in the background. We do not know exactly when the futures will finish running, so we can `and_then` to get the result of the computation and use it in our program.

So what exactly is the executor doing behind the scenes? We can start by looking at the [`Future`](https://doc.rust-lang.org/beta/std/future/trait.Future.html) trait from the standard library:
```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```