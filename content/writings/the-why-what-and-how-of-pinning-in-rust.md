---
template: writing.html
title: The Why, What, and How of Pinning in Rust
slug: the-what-why-and-how-of-pinning-in-rust
socialImage: /media/rust-logo.png
draft: true
date: 2020-12-24T03:19:12.408Z
description: TODO
mainTag: Rust
tags:
  - Rust
  - Async
---

# The Problem

Imagine we had to following struct:
```rust
struct Foo {
    bytes: [u8; 3],
    first: *const u8,
         // ^^^^^^ this is a pointer to `bytes`
}
```

`Foo` holds an array of bytes, and a pointer to the first element. This likely would never come up in "the real world", but it illustrates the problem well.

You can create a new `Foo` by allocating it on the heap and then creating a raw pointer to the first element: 
```rust
impl Foo {
    fn new(bytes: [u8; 3]) -> Box<Self> {
        let mut foo = Box::new(Foo {
            bytes,
            first: std::ptr::null(),
        });

        foo.first = &foo.bytes[0] as *const u8;
        foo
    }
}
```

Let's try it out:
```rust
let mut foo = Foo::new([255, 254, 253]);
```

At this point, `first` points to the value behind the first element of the array:
```rust
unsafe { assert_eq!(foo.bytes[0], *foo.first) };
```

Now, let's create another `Foo`:
```rust
let mut foo2 = Foo::new([1, 2, 3]);
```

Again, we can check to see that `first` is pointing to the correct element:
```rust
unsafe { assert_eq!(foo2.bytes[0], *foo2.first) };
```

Now, for some reason, we decide to swap both of these types.
```rust
std::mem::swap(&mut *foo, &mut *foo2);
```

And let's just double check that the pointers are correct again...
```rust
unsafe { assert_eq!(foo.bytes[0], *foo.first) };
```
```none
thread 'main' panicked at 'assertion failed: `(left == right)`
  left: `1`,
 right: `255`', src/main.rs:25:14
```

Wait... what just happened?

We started off like this:
```
foo.bytes:                              foo2.bytes:
 
          |‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾|             |‾‾‾|‾‾‾|‾‾‾|
          | 255 | 254 | 253 |             | 1 | 2 | 3 |
          |_____|_____|_____|             |___|___|___|
        
            ^                               ^
foo.first __|                  foo2.first __|
```

And then we swapped `foo` with `foo2`. `mem::swap` moved the array to a new location on the heap. But `foo.first` *still* points to the old location of the array, which is now the location of `foo2`. This means that `foo.first` now points to `foo2.bytes[0]`, and vice versa:
```
foo2.bytes:                              foo.bytes:
        
          |‾‾‾|‾‾‾|‾‾‾|               |‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾|
          | 1 | 2 | 3 |               | 255 | 254 | 253 |
          |___|___|___|               |_____|_____|_____|

            ^                            ^
foo.first __|               foo2.first __|
```

So if we drop `foo2`...
```rust
drop(foo2);
unsafe { assert_eq!(foo1.bytes[0], *foo1.first) };
```
```
thread 'main' panicked at 'assertion failed: `(left == right)`
  left: `1`,
 right: `16`', src/main.rs:26:14
```

We are now accessing random memory on the heap, and have triggered undefined behavior.
```
foo2.bytes:                              foo.bytes:
        
                                      |‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾|
                                      | 255 | 254 | 253 |
          ....                        |_____|_____|_____|

            ^                            ^
foo.first __|               foo2.first __|
```

How can we prevent this from happening?

Here is another example with an `async` function:

```rust
async fn foo(file: File) {
    let buf = [0; 1024];
    file.read(&mut buf[..]).await;
}
```

You might be thinking, what does the above function have anything to do with `Parser`? They seem to have nothing in common. However, when we desugar the async/await syntax, we see that they are actually both running into the same problem:
```rust
fn foo(file: File) -> impl Future<Output = ()> {
    async move {
        let buf = [0; 1024];
        file.read(&mut buf[..]).await;
    }
}
```

`async fn` desugars into a function returning a `Future`. In this case, the future does not output anything, because `foo` does not return anything. But what do the `.await` calls desugar to?

Under the hood, the compiler is going to to look for every `await` point, and (sort of) turn it into a `yield`:
```rust
fn foo(file: File) -> impl Future<Output = ()> {
    async move {
        let buf = [0; 1024];
        yield file.read(&mut buf[..]);
    }
}
```

When `foo` is called it starts executing until it hits the first `yield`. The executor then stops working on `foo` and moves on to executing the future being yielded (`file.read`). Once that future completes, the executor needs to continue executing `foo` from the last `yield` point. You can imagine that each `yield` is a break point in a state machine. This means that any state that was created before a `yield` needs to preserved and stored somewhere for it to be referenced by the next `yield`. In our example, we need to maintain `buf` between yields, because it is *referenced* later by the `read`, `write` operations. We can visualize this by manually writing the state machine generated for the `foo`:
```
// again, this is not what *really* happens, but it helps to visualize the problem

struct FooFuture {
  
}
```

At the beginning of `foo` we have the buffer (`buf`). In `Step1`, the `fs::read` operation references that buffer. You can almost imagine that each step of the future contains references that are valid for the lifetime of the first step (`start`). If we look back at the parser for before, we can now see the similarities between it and `foo`:
```rust
struct Parser {
    bytes: Vec<u8>,
    target: &'bytes u8
}
```

The problem that we are struggling to express with both of these types is that they are *self-referential* - they both have pointers into themselves. Here is a visualization of them memory location of a `Parser`:
```rust
p.bytes:
  |‾‾‾|‾‾‾|‾‾‾|‾‾‾|
  | 0 | 1 | 0 | 1 |
  |___|___|___|___|
            ^
            |
p.target: *_|
```

The issue arises when you *move* the parser's bytes, which seems like a totally valid thing to do. Let's see what would happen if you moved `bytes`:
```
                p.bytes:
                  |‾‾‾|‾‾‾|‾‾‾|‾‾‾|
                  | 0 | 1 | 0 | 1 |
           ???    |___|___|___|___|
            ^
            |
p.target: *_|
```

If the parser's bytes are moved, `target` immediately becomes an invalid pointer. This means that we can under no circumstances *move* `bytes`. This is where pinning comes in. The idea behind pinning is that the moment you place a value in a `Pin`, you are promising that you will not move it again. For example, `async fn foo` can only work if `buf` is pinned in memory:
```rust
async fn foo() {
    let buf = [0; 1024];
    File::open("foo.txt").read(&mut buf[..]).await;
}
```
If `buf` was not pinned, then we would run into the same memory problem that we encountered with `Parser`.`file.read` references the buffer, so if buffer was moved in memory in the middle of the execution of `foo`, that references would be invalidated:
```rust
Step 1:

buf:
  |‾‾‾|‾‾‾|‾‾‾|‾‾‾|
  | 0 | 1 | 0 | 1 |
  |___|___|___|___|
  
Step 2:
        // sorry, buf used to be here
        // but now it is gone ...
               ^
               |    
file.read *buf_|
```

If we go back to the state machine that we wrote for `FooFuture`:
```rust
struct FooFuture {
    buf: [u8; 1024],
    progress: enum {
    	Step0,
	Step1(FileRead<'buf>)
    }
}
```

We can see in practice why we need pinning.

`poll` is the method that drives the future forward. This is the method called by the executor that moves a future through each step of it's state machine. Without pinning, code like this would be accepted by the compiler:
```rust
let f: FooFuture = foo();
let z = f; // buf is now moved in memory;
z.f.poll(); // BAD: fs::write references the old location of buf
```

However, the `Future` trait requires that it is pinned in memory:
```rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

```rust
Step 1:

// the buffer is pinned in memory
// so it won't move throughout the
// execution of `foo`

pinned buf:
      |‾‾‾|‾‾‾|‾‾‾|‾‾‾|
      | 0 | 1 | 0 | 1 |
      |___|___|___|___|
  
Step 2:        ^   ^
               |   |    
file.read *buf_|   |
                   |
Step 3:            |
                   |
fs::write *buf_____|
```


```rust
struct IoRead<'a> {
   buf: &'a mut [u8],
   s: &mut File   
}

impl<'a> Future for IoRead<'a> {
    type Output = io::Result<usize>;
    fn poll(self: Pin<&mut Self>) -> Poll<Self::Output> {
        // ...  	
    }
}
```
