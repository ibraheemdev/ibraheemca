---
template: writing.html
title: "Interior Mutability in Rust: The Cell Type"
slug: rust-interior-mutability-understanding-cell
draft: false
date: 2020-12-09T03:43:03.938Z
description: Today we are going to be talking about smart pointers and interior
  mutability, specifically, the Cell type. Cell is a type that you come across
  frequently in Rust programs that it can help to have a deeper understanding of
  what it is and how it works. One of the best ways to understand Cell and the
  fundamental concepts behind its implementation is to actually write it
  yourself. So that is what we are going to do!

taxonomies:
    tags:
        - Rust

extra:
    socialImage: /media/rust-logo.png
---
*This post was partly derived from Jon Gjenset's stream [Crust of Rust: Smart Pointers and Interior Mutability](https://www.youtube.com/watch?v=8O0Nt9qY_vo&ab_channel=JonGjengset).*

### Introduction

Today we are going to be talking about smart pointers and interior mutability, specifically, the `Cell` type. `Cell` is a type that you come across frequently in Rust programs and it can help to have a deeper understanding of what it is and how it works. One of the best ways to understand `Cell` and the fundamental concepts behind its implementation is to actually write it yourself. So that is what we are going to do!

### Cell

The Rust standard library has a module called [`cell`](https://doc.rust-lang.org/std/cell/index.html) which contains "shareable mutable containers". You probably already know that the Rust ownership model has the concept of shared references (`&T`) and exclusive (mutable) references (`&mut T`). Having an exclusive reference means that the borrow checker *guarantees* that you are the exclusive owner of the pointer, which allows you to mutate the value behind it. A *shareable mutable container* sounds pretty weird at first, because you should not be allowed to mutate a value if someone else has mutable access to it, right? However, the `cell` module provides primitives that allow shared mutability in a controlled manner under specific circumstances. This is often referred to as "interior mutability", because it allows mutation from an immutable reference. The `cell` module contains a couple of different interior mutability primitives. In this post, we will look at `Cell`.

Let's start by looking at the basic API of `Cell`. You can create a new `Cell` with the `new` method:

```rust
// pub const fn new(value: T) -> Cell<T>

let c = Cell::new(5);
```

You can mutate the cell's interior with the `set` method. Notice that `set` takes an immutable reference to `self`, and yet still allows you to mutate the contained value. This is how `Cell` provides interior mutability:

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

Notice that the `get` method requires `T` to be `Copy`. This is because instead of returning a reference to the inner value, `get` returns a copy of it. If you look through all the methods on `Cell`, you would see that there is no (safe) way to get a reference to it's inner value. You can replace it, set it, or swap it, but you can never get a reference to it. This concept is what allows `Cell` to provide interior mutability, because it guarantees that nobody else has a reference to `Cell`:

> If we know that no one else has a pointer to the value that we are storing inside of `Cell`, then changing that value is fine.

Because getting the value of a `Cell` requires the inner value to be `Copy`, `Cell` is mainly useful for smaller types such as integers or bools. Copying larger structs for each `get` would be inefficient.

The other mechanism that `Cell` uses to provide safe interior mutability is that it does not implement `Sync`:

```rust
impl<T> !Sync for Cell<T>
where
    T: ?Sized, 
```

This means that references to a `Cell` cannot be shared between threads. If two threads both have mutable access to the value inside of `Cell`, then they could both try to change the value *at the same time*, which would cause many of the problems that Rust was built to prevent. These two compile-time guarantees are what allow `Cell` to provide safe interior mutability:

* No one has a shared reference to `Cell`'s inner value
* `Cell` cannot be shared between threads

### Why is Cell useful?

So why is `Cell` useful? Let's start with an example. We might have a graph holding a vector of nodes which each contain an individual count. The graph also holds an aggregation of all it's nodes counts:

```rust
struct Graph {
    total_count: u8,
    nodes: Vec<Node>,
}

struct Node {
    count: u8,
}
```

We now want to traverse the graph updating every individual node's count as well as the graph's total count:

```rust
impl Node {
    fn update(&mut self) {
        self.count += 1;
    }   
}

impl Graph {
    fn traverse(&mut self) {
        for node in self.nodes.iter_mut() {
            node.update();
            self.update(node.count);
        }
    }

    fn update(&mut self, node_count: u8) {
        self.total_count += node_count;
    }
}
```

However, this poses a problem, because we are trying to borrow `self` as mutable multiple times:

```rust
error[E0499]: cannot borrow `*self` as mutable more than once at a time
  --> src/lib.rs:20:13
   |
18 |     for node in self.nodes.iter_mut() {
   |                      ----------------
   |                      |
   |                      first mutable borrow occurs here
   |                      first borrow later used here
19 |         node.update_count();
20 |         self.update_count(node.count);
   |         ^^^^ second mutable borrow occurs here
```

This is a perfect use case for `Cell`. If we wrap the value in a `Cell`, then we can modify the values entirely through shared references:

```rust
struct Graph {
    total_count: Cell<u8>,
    nodes: Vec<Node>,
}

struct Node {
    count: Cell<u8>,
}

impl Node {
    fn update(&self) {
        self.count.set(self.count.get() + 1);
    }   
}

impl Graph {
    fn traverse(&self) {
        for node in self.nodes.iter() {
            node.update();
            self.update(node.count.get());
        }
    }

    fn update(&self, node_count: u8) {
        self.total_count.set(self.count.get() + node_count);
    }
}
```

Because `Cell` guarantees that no one else has a pointer to the value, we can mutate the values through shared references and our code now compiles. 

### Implementing `Cell`

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

Right now our code will not compile, because we are trying to mutate a value through a shared reference, which violates Rust's fundemental borrowing rules:

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

The `set` method needs to modify the inner value of `UnsafeCell,` so we can get a raw pointer to the value with the `UnsafeCell::get` method, and set it to `value`:

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

In Rust, dereferencing a raw pointer is an `unsafe` operation. The compiler does not know that it is okay for us to mutate a value through an immutable reference. We have to wrap the operation in an `unsafe` block to tell the compiler that we know dereferencing `self.value` here is safe:

```rust
pub fn set(&self, value: T) {
  unsafe { *self.value.get() = value };
}
```

Even though the compiler accepts our code, how do *we* know that it is safe? Right now, the code is simply **wrong**. Let's create a test case to illustrate the problems with our code:

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

Until now we have not written anything to prevent the above code from being written. Two threads could potentially try to modify the same memory at the same time. This could result in data races or lost memory. We need some way to tell the `Cell` is not safe to be shared between threads. We can do this through negative trait bounds.

```rust
impl<T> !Sync for Cell<T> {}
```

`!Sync` tells the compiler that it is not safe to share references to `Cell` between threads. However, negative trait bounds are currently an unstable feature. For now, the work around is to store a `!Sync` value in our `Cell` type, which would cause the entire `Cell` type to be `!Sync`. And guess what type is `!Sync`?

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

Now that we know our `set` method is safe, we can write the `get` method:

```rust
pub fn get(&self) -> T
where
  T: Copy,
{
  unsafe { *self.value.get() }
}
```

As explained above, we have to return a copy of the inner value, not a reference. If we returned a reference, then we are opening the doors to undefined behavior. Look what could potentially happen if `get` returned a reference instead of a copy:

```rust
impl<T> Cell<T> {
  // violates the safety of interior mutability
  // this is BAD
  pub fn get(&self) -> T
  {
    unsafe { &*self.value.get() }
  }
}

#[test]
fn bad2() {
  let x = Cell::new(vec![String::from("Hello")]);
  
  // get a reference to the inner value of `x`
  let hello: &String = &x.get()[0];
  assert_eq!(hello, "Hello"); // ok
  
  x.set(vec![]); // the value inside of `x` changed, but we still have a pointer to it!

  // what does `hello` refer to now???
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

Hopefully by now you have an understanding of what `Cell` is, how it works internally, and how the interior mutability it provides can be useful in Rust programs. In [the next post](/pages/todo), we will discuss another type in the `cell` module: `RefCell`.

[The final code for our implementation of `Cell` is available on github](https://gist.github.com/ibraheemdev/8dc7c18063516bde6f478a925cc451b8)
