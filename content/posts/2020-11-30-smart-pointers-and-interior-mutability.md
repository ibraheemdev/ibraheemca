---
template: post
title: Smart Pointers and Interior Mutability
slug: smart-pointers-and-interior-mutability
socialImage: /media/rust-logo.png
draft: true
date: 2020-11-30T17:47:12.906Z
description: Today we cover smart pointers and interior mutability, by re-implementing the Cell, RefCell, and Rc types from the standard library. As part of that, we cover when those types are useful, how they work, and what the equivalent thread-safe versions of these types are (Arc, Mutex, and RwLock). In the process, we go over some of the finer details of Rust's ownership model, and the UnsafeCell type. We also dive briefly into the Drop Check rabbit hole before coming back up for air.

mainTag: Rust
tags:
  - Rust
  - Crust of Rust
---

_This post was derived from Jon Gjenset's stream [Crust of Rust: Smart Pointers and Interior Mutability](https://www.youtube.com/watch?v=8O0Nt9qY_vo&ab_channel=JonGjengset). Go watch that if you prefer watching a video over reading a blog post._

### Introduction

Today we are going to be talking about smart pointers and interior mutability. There are a couple of types that you come across frequently in Rust programs that it can help to have a deeper understanding of what they are and how they work. These types include `Arc`, `Mutex`, `Rc`, `RefCell`, `Cell`, and `Cow`. One of the best ways to understand these types and the concepts behind them is to actually implement themselves yourself.

### Cell

The Rust standard library has a module called [`cell`](https://doc.rust-lang.org/std/cell/index.html), which contains "shareable mutable containers". The Rust ownership has the notion of a shared reference (`&T`) and an exlusive (mutable) reference. Having an exclusive reference means that the borrow checker guarantees that you are the exclusive owner of the pointer, which allows you to mutate the value behind it. A "shareable mutable container" sounds weird at first, because you should not be allowed to mutate a value if someone else has access to it, right? The `cell` module provides primitives that allow shared mutability in a controlled manner under specific circumstances. This is often refered to as "interior mutability", because it allows mutation inside an immutable struct. The `cell` module contains a couple of different interior mutability primitives, but we will start of with `Cell`.

Let's look at the basic API of `Cell`. You can create a new `Cell` with the `new` method:
```rust
// pub const fn new(value: T) -> Cell<T>

let c = Cell::new(5);
```

You can mutate the cell's interior with the `set` method. Notice that `set` takes an immutable reference to `self`, and yet still allows you to mutate the contained value:
```rust
// pub fn set(&self, val: T)

let c = Cell::new(5);
c.set(10);
```

You can also `get` the cell's inner value:
```rust
// pub fn get(&self) -> T
// where T: Copy, 

let c = Cell::new(5);
let five = c.get();
```

Notice that the `get` method requires `T` to be `Copy`. This is because instead of returning a reference to the inner value (`&T`), `get` returns a copy of it. If you look through all the methods on `Cell`, you would see that there is no (safe) way to get a reference to it's inner value. You can replace it, set it, or swap it, but you can never get a reference to it. This concept is what allows `Cell` to provide interior mutability, because it guarantees that nobody else has a reference to `Cell`. 

> If we know that no one else has a pointer to the value that we are storing inside of `Cell`, then changing that value is fine.

The other mechanism that `Cell` uses to provide safe interior mutability is that it does not implement `Sync`:
```rust
impl<T> !Sync for Cell<T>
where
    T: ?Sized, 
```

This means that references to a `Cell` cannot be shared between threads. If two threads both have mutable access to the value inside of `Cell`, then they could both try to change the value *at the same time*, which of course, would cause many of the problems that Rust was built to prevent. These two compile-time guarantees are what allows `Cell` to provide interior mutability:

* No one has a shared reference to `Cell`'s inner value
* `Cell` cannot be shared between threads

So why is `Cell` useful? `Cell` provides the ability to pass multiple shared refernces to a single value. Imagine a graph where multiple nodes have access to a single shared value. Your program is single-thread, so you know that only one node will be mutating the value at any point in time. `Cell` allows multiple nodes to mutate that value in `safe` Rust. Now that we understand what `Cell` is, let's try implementing it ourselves: