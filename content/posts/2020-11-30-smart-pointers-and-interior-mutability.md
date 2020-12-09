---
template: post
title: "Interior Mutability in Rust: Understanding The Cell Type"
slug: rust-interior-mutability-understanding-cell
socialImage: /media/rust-logo.png
draft: false
date: 2020-12-09T03:43:03.938Z
description: Today we are going to be talking about smart pointers and interior
  mutability, specifically, the `Cell` type. `Cell` is a type that you come
  across frequently in Rust programs that it can help to have a deeper
  understanding of what it is and how it works. One of the best ways to
  understand `Cell` and the fundemental concepts behind its implementation is to
  actually write it yourself. So that is what we are going to do!
mainTag: Rust
tags:
  - Rust
---
*This post was partly derived from Jon Gjenset's stream [Crust of Rust: Smart Pointers and Interior Mutability](https://www.youtube.com/watch?v=8O0Nt9qY_vo&ab_channel=JonGjengset).*

### Introduction

Today we are going to be talking about smart pointers and interior mutability, specifically, the `Cell` type. `Cell` is a type that you come across frequently in Rust programs that it can help to have a deeper understanding of what it is and how it works. One of the best ways to understand `Cell` and the fundemental concepts behind its implementation is to actually write it yourself. So that is what we are going to do!

### Cell

The Rust standard library has a module called [`cell`](https://doc.rust-lang.org/std/cell/index.html), which contains "shareable mutable containers". The Rust ownership has the notion of a shared reference (`&T`) and an exclusive (mutable) reference. Having an exclusive reference means that the borrow checker guarantees that you are the exclusive owner of the pointer, which allows you to mutate the value behind it. A "shareable mutable container" sounds weird at first, because you should not be allowed to mutate a value if someone else has access to it, right? However, the `cell` module provides primitives that allow shared mutability in a controlled manner under specific circumstances. This is often referred to as "interior mutability", because it allows mutation inside an immutable struct. The `cell` module contains a couple of different interior mutability primitives. In this post, we will look at `Cell`.

Let's start by looking at the basic API of `Cell`. You can create a new `Cell` with the `new` method:

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

So why is `Cell` useful? `Cell` provides the ability to pass multiple shared references to a single value. Imagine a graph where multiple nodes have access to a single shared value. Your program is single-threaded, so you know that only one node will be mutating the value at any point in time. Using `Cell` allows multiple nodes to mutate that value in `safe` Rust. 

Now that we understand what `Cell` is, let's try implementing it ourselves. We can start with a basic API for the `Cell` struct:

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

Right now, of course, our code will not compile, because we are trying to mutate a value through a shared reference, which violates Rust's fundemental borrowing rules:

```rust
error[E0594]: cannot assign to `self.value` which is behind a `&` reference
  --> src/lib.rs:11:5
   |
10 |   pub fn set(&self, value: T) {
11 |     self.value = value;
   |     ^^^^^^^^^^ `self` is a `&` reference, so the data it refers to cannot be written
```

So, how do we mutate an immutable reference? At the heart of the `Cell` type in the standard library is a type called `UnsafeCell`. `UnsafeCell` is the core primitive for interior mutability in Rust. On its own, it is completely unsafe to use. `UnsafeCell` allows you to get a raw mutable pointer to it's underlying value. It is up to the user to cast that raw pointer to an exclusive reference in a safe manner. The **only** way in Rust to correctly go from a shared reference to an exclusive reference is through `UnsafeCell`. This is due to compiler mechanisms specific to `UnsafeCell`.

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

The `set` method needs to modify the inner value of `UnsafeCell,` so we can get a raw pointer to the value with `UnsafeCell`'s get method and set it to `value`:

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
    let x = Arc::new(Cell::new(42));
    
    let x1 = x.clone();
    std::thread::spawn(move || {
      x1.set(1);
    });

    let x2 = x.clone();
    std::thread::spawn(move || {
      x2.set(2);
    });
  }
}
```

Right now, we have not written anything to prevent the above code from being written. Two threads could potentially try to modify the same memory at the same time. This could result in data races or lost memory. We need some way to tell the `Cell` is not safe to be shared between threads. We can do this through negative trait bounds.

```rust
impl<T> !Sync for Cell<T> {}
```

`!Sync` tells the compiler that it is not safe to share references to `Cell` between threads. However, negative trait bounds are currently an unstable feature. For now, the work around is to store an `!Sync` value in our `Cell` type, which would cause the entire `Cell` type to be `!Sync`. And guess what type is `!Sync`?

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
impl<T> Cell<T> {
  // violates the safety of interior mutability
  pub fn get_reference(&self) -> T
  {
    unsafe { &*self.value.get() }
  }
}

#[test]
fn bad2() {
  let x = Cell::new(vec![String::from("Hello")]);
  
  let hello: &String = &x.get_reference()[0];
  assert_eq!(hello, "Hello"); // ok
  
  x.set(vec![]); // the value inside of `x` changed, but we still have a pointer to it!

  assert_eq!(hello, "Hello"); // thread 'main' panicked at 'assertion failed`
}
```

Because we are never return a reference, we know that one else has a pointer to the value that we are storing inside of `Cell`, so changing that value is fine.

Now our `Cell` type meets the two requirements of interior mutability listed above:

* No one has a shared reference to `Cell`'s inner value: `get` returns a copy, not a reference
* `Cell` cannot be shared between threads: `UnsafeCell` is `!Sync`, and therefore `Cell` is also `!Sync`

Here is the final code for `Cell`:

```rust
use std::cell::UnsafeCell;

pub struct Cell<T> {
  value: UnsafeCell<T>
}

// implied by UnsafeCell
// impl<T> !Sync for Cell<T> {}

impl<T> Cell<T> {
  pub fn new(value: T) -> Self {
    Cell { value: UnsafeCell::new(value) }
  }

  pub fn set(&self, value: T) {
    // SAFETY: We know that no-one else is mutating self.value (because Cell is !Sync) 
    // and we know that we are not invalidating any references because we never give any out
    unsafe { *self.value.get() = value };
  } 

  pub fn get(&self) -> T
  where
    T: Copy,
  {
    // SAFETY: We know that no-one else is mutating self.value (because Cell is !Sync)
    unsafe { *self.value.get() }
  }
}
```

Hopefully by now you have an understanding of what `Cell` is, how it works internally, and how the interior mutability it provides can be useful in Rust programs. In [the next post](todo.com), we will discuss another type in the `cell` module, `RefCell`.

[The final code for our implementation of `Cell` is available on github](https://gist.github.com/ibraheemdev/8dc7c18063516bde6f478a925cc451b8)