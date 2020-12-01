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

We can start with a basic API for the `Cell` struct:
```rust
pub struct Cell<T> {
  value: T
}

impl<T> Cell<T> {
  pub fn new(value: T) -> Self {
    Cell { value }
  }

  pub fn set(&self, value: T) {
    self.value = value;
  }

   pub fn get(&self, value: T) -> T {
    self.value
  }
}
```

Right now, of course, our code will not compile:
```rust
error[E0594]: cannot assign to `self.value` which is behind a `&` reference
  --> src/lib.rs:11:5
   |
10 |   pub fn set(&self, value: T) {
11 |     self.value = value;
   |     ^^^^^^^^^^ `self` is a `&` reference, so the data it refers to cannot be written
```

So, how do we mutate an immutable reference? At the core of the `Cell` type in the standard is a type called `UnsafeCell`. `UnsafeCell` is the core primitve for interior mutability in Rust. On its own, it is completely unsafe to use. `UnsafeCell` allows you to get a raw mutable pointer to it's underlying value. It is up to the user to cast that raw pointer to an exlusive reference in a safe manner. `UnsafeCell` is essentially a building block for interrior mutability. 

Let's try wrapping the value `T` in an `UnsafeCell`:
```rust
use std::cell::UnsafeCell;

pub struct Cell<T> {
  value: UnsafeCell<T>
}
```

Now, the `new` method creates a new `UnsafeCell` that the wraps `value`:
```rust
impl<T> Cell<T> {
  pub fn new(value: T) -> Self {
    Cell { value: UnsafeCell::new(value) }
  }
}
```

The `set` method needs to modify the inner value of `UnsafeCell`. We can get a raw pointer to the value with `UnsafeCell`'s get method and set it to `value`:
```rust
// UnsafeCell: pub const fn get(&self) -> *mut T

impl<T> Cell<T> {
  pub fn set(&self, value: T) {
    *self.value.get() = value;
  }
}
```

This however, poses a problem:
```rust
error[E0133]: dereference of raw pointer is unsafe and requires unsafe function or block
  --> src/lib.rs:13:5
   |
13 |     *self.value.get() = value;
   |     ^^^^^^^^^^^^^^^^^ dereference of raw pointer
```

In Rust, dereferencing a raw pointer is an `unsafe` operation. The compiler does not know that it is okay for us to mutate a value through an immutable reference. To circumvent this issue, we can wrap the operation in an `unsafe` block:
```rust
pub fn set(&self, value: T) {
  unsafe { *self.value.get() = value };
}
```

Even though the compiler accepts our code, how do we know that it is safe? Right now, the code is simply *wrong*. Let's create a test case to illustrate the problems with our code:
```rust
#[cfg(test)]
mod test {
  use super::*;
  use std::sync::Arc;

  #[test]
  fn bad() {
    // `Arc` let's us share values across threads
    // we'll talk about it in more detail later
    let x = Arc::new(Cell::new(42));
    
    let x1 = x.clone();
    std::thread::spawn(move || {
      x1.set(44);
    });

    let x2 = x.clone();
    std::thread::spawn(move || {
      x2.set(44);
    });
  }
}
```

Right now, we have not written anything to prevent the above code from being written. If two threads try to modify the same `Cell` at the same time, we are opening up the doors to undefined behavior. We need some way to tell the `Cell` is not safe to be shared between threads:
```rust
impl<T> !Sync for Cell<T> {}
```

Negative trait bounds are currently an unstable feature. For now, the work around is to store an `!Sync` value in our `Cell` type. And guess what type is `!Sync`?
```rust
impl<T> !Sync for UnsafeCell<T>
where
    T: ?Sized, 
```

`UnsafeCell` is already `!Sync`. Even though we have not explicitly marked `Cell` as `!Sync`, it is already implied by `UnsafeCell`. This means that our test suite will not compile:
```rust
error[E0277]: `UnsafeCell<i32>` cannot be shared between threads safely
   --> src/lib.rs:32:5
    |
32  |     std::thread::spawn(|| {
    |     ^^^^^^^^^^^^^^^^^^ `UnsafeCell<i32>` cannot be shared between threads safely
    = help: within `Cell<i32>`, the trait `Sync` is not implemented for `UnsafeCell<i32>`
    = note: required because it appears within the type `Cell<i32>`
```

Now that we know that our `set` method is safe, we can write the `get` method:
```rust
pub fn get(&self) -> T
where
  T: Copy,
{
  unsafe { *self.value.get() }
}
```

As explained above, we have to return a copy of the inner value, not a reference. If we returned a reference, then we are opening the doors to undefined behavior:
```rust
#[test]
fn bad2() {
  let x = Cell::new(vec![String::from("Hello")]);
  
  let hello: &String = &x.get_reference()[0];
  assert_eq!(hello, "Hello"); // ok
  
  x.set(vec![]); // the value inside of `x` changed, but we still have a pointer to it!

  assert_eq!(hello, "Hello"); // thread 'main' panicked at 'assertion failed`
}
```

> If we know that no one else has a pointer to the value that we are storing inside of `Cell`, then changing that value is fine.

Now our `Cell` type meets the two requirements of interior mutability listed above:

* No one has a shared reference to `Cell`'s inner value: `get` returns a copy, not a reference
* `Cell` cannot be shared between threads: `UnsafeCell` is `!Sync`, and therefore `Cell` is also `!Sync`