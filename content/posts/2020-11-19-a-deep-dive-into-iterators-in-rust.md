---
template: post
title: A Deep Dive into Iterators in Rust
slug: rust-iterators-in-depth
socialImage: /media/rust-logo.png
draft: true
date: 2020-11-19T17:47:12.906Z
description: Today we will be taking an in-depth look at iterators. Iterators
  are something that you will run into a lot in Rust, and you may have used them
  without even knowing. So what is an iterator?
mainTag: Rust
tags:
  - Rust
  - Iterators
---
Today we will be taking an in-depth look at iterators. Iterators are something that you will run into a lot in Rust, and you may have used them without even knowing. So what is an iterator?

An iterator is a trait with two required attributes:

Let’s look at the iterator trait:

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

The iterator trait has an associated type called `Item`, and a method called `next()`. `Item` is the type that will be yielded by the iterator. The next method is called by the thing that drives the iterator, and will yield an `Option` containing the item. Let’s take a look at an example:

```rust
for x in vec![1, 2, 3] {
    do_stuff()
}
```

Once you get below a certain level in the Rust syntax, for loops actually don’t exist. The for loop above is really just syntax sugar for the following:

```rust
let mut iter = vec![1, 2, 3].into_iter();
while let Some(x) = iter.next() {
    do_stuff()
}
```

The type that was passed as an argument to `for`, we call `into_iter()` on. `into_iter` provides us with an iterator over the vector of numbers. The for loop can now be replaced with a while loop, which keeps calling `next()` on the iterator until it is empty (it returns `None`).

*Note that the desugaring of a for loop may not be exactly as shown above*

Before we start looking at the iterator implementation, let’s take a look at the `into_iter` method. `into_iter` is a method of a separate trait called `IntoIterator`. `IntoIterator` represents anything that can be turned into an `Iterator`. For example, the `IntoIterator` is implemented for mutable hashmaps:

```rust
impl<K, V, S> IntoIterator for &mut HashMap<K, V, S> {
    type Item = (& K, &mut V);
    type IntoIter = IterMut<K, V>;

    fn into_iter(self) -> IterMut<K, V> {
        self.iter_mut()
    }
}
```
The item that is returned from the hashmap iterator is a tuple containing a key, and a mutable reference to the value. `IntoIterator` also has an associated type called `IntoIter`. This represents the type of the iterator that it will be turned into, which, in this case, is `IterMut`.

# FAQ


Most of the time, you will implement `IntoIterator` as opposed to implementing the `Iterator` trait directly.
