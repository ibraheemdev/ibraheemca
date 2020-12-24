---
template: post
title: The Why, What, and How of Pinning in Rust
slug: the-what-why-and-how-of-pinning-in-rust
socialImage: /media/rust-logo.png
draft: true
date: 2020-12-24T03:19:12.408Z
description: With futures and async/await, many people are being exposed to the
  Pin type and its sibling trait Unpin. In this post, we dive deep into what
  these types are, why they are needed, how they work, and how to use them. We
  also dig into the connection to Futures and async/await, as well as potential
  use cases beyond in Futures. We also discuss structural pinning, and how you
  can use pin-project to avoid using unsafe and make your life a little bit
  easier.
mainTag: Rust
tags:
  - Rust
  - Async
---

Pinning landed in the standard library shortly before the stabilization of async/await. It is usually talked about in the context of async/await because that is where it is primarily used in Rust today. However, pinning is not really about async/await. Instead, it is a more general concept that happens to solve some of the problems that async/await ran into. In this post, we will dive deep into what pinning is, why it is needed, how it works, and how to apply it to your code.

# The Problem

What is the fundemental problem that pinning is trying to solve? Imagine you had the following struct:
```rust
struct Parser<'a> {
    bytes: Vec<u8>,
    target: &'a u8,
}
```

You have a struct called `Parser`. It contains a vector of `bytes`, as well as a `target`. Target here is a pointer into the `bytes`. This means that `Parser` contains references to itself. At first, the code seems totally fine. We can use it to write a simple `parse` method:
```rust
fn parse<'a>(input: &'a [u8]) -> Result<Parsed<'a>, _> {
    // ...
}
```

The function `parse` has a lifetime, because `Parsed` contains references. But what if we did not want `Parsed` to have a lifetime? What we really want to say is that `target` is valid for the lifetime of `bytes`:
```rust
struct Parser {
    bytes: Vec<u8>,
    target: &'bytes u8
}
```

While the above syntax is not valid in Rust today, it helps understand some of the problems that async/await runs into. Here is another example with an `async` function:
```rust
async fn foo(file: File) {
    let buf = [0; 1024];
    file.read(&mut buf[..]).await;
    fs::write(file, &buf[..]).await;
}
```

You might be thinking, what does the above function have anything to do with `Parser`? They seem to have nothing in common. However, when we desugar the async/await syntax, we see that they are actually both running into the same problem:
```rust
fn foo(file: File) -> impl Future<Output = ()> {
    async move {
        let buf = [0; 1024];
        file.read(&mut buf[..]).await;
        fs::write(file, &buf[..]).await;
    }
}
```

`async fn` desugars into a function returning a `Future`. In this case, the future does not output anything, because `foo` does not return anything. But what do the `.await` calls desugar to?

Under the hood, the compiler is going to to look for every `await` point, and turn it into a `yield`:
```rust
// this is a simplified version of what really happens

fn foo(file: File) -> impl Future<Output = ()> {
    async move {
        let buf = [0; 1024];
        yield file.read(&mut buf[..]);
        yield fs::write(file, &buf[..]);
    }
}
```

When `foo` is called, it starts executing until it hits the first `yield`. The executor then stops working on `foo` for now and moves on to executing the future being yielded. Once that future completes, the executor needs to continue executing `foo` from the last `yield` point. This happens for all the `yield` points until `foo` is done, and the final value can be returned. But what does "continue from" actually mean? You can imagine that each `yield` is a break point in a state machine. This means that any state that was created before a `yield` needs to preserved and stored somewhere for it to be referenced by the next `yield`. In our example, we need to maintain `buf` between yields, because it is *referenced* later by the `read`, `write` operations. You can visualize this by manually writing the state machine generated for the `foo`:
```
// again, this is not what *really* happens, but it helps to visualize the problem

enum FooFuture {
    Start([u8; 1024]),
    Step1(FileReadFuture<'start>),
    Step2(FileWriteFuture<'start>)
} 
```

At the beginning of `foo` we have the buffer (`buf`). In `Step1`, the `fs::read` operation references that buffer. Similarly, `Step2` also references that buffer. You can almost imagine that each step of the future contains references that are valid for the lifetime of the first step (`start`). If we look back at the parser for before, we can now see the similarities between it and `foo`:
```rust
struct Parser {
    bytes: Vec<u8>,
    target: &'bytes u8
}
```

The problem that we are struggling to express with both of these types is that they are *self-referential* - they both have pointers into themselves.

So what does any of this have to do with pinning?


