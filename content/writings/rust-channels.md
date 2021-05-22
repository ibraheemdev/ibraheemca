---
template: writing.html
title: Channels in Rust
slug: rust-channels
draft: true
date: 2021-04-08
description: > 
    Rust provides asynchronous channels for communication
    between threads. They allow a one directional flow of information
    between two end-points: the Sender and the Receiver.
    But what even is a channel? How does it work internally?

taxonomies:
    tags:
        - Rust
        - Iterators

extra:
    socialImage: /rust-logo.png
---

The standard library `mspc` module contains what are know as *multi-producer single-consumer* channels. Channels provide a way of commmunicating between two places, primarily across thread boundaries. `mpsc` means that you can have multiple senders communicat to a single receiver.

You can create a channel with the `channel` method:

```rust
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();
```

The channel method returns a sender and a receiver, both of which are generic over `T`:
```rust
pub fn channel<T>() -> (Sender<T>, Receiver<T>)
```

This means that you can send/recieve any values of the same type through a channel.

As the name implies, senders can *send* values:
```rust
tx.send(1).unwrap();
tx.send(2).unwrap();
```

And receivers can *recieve* values, blocking the current thread until a message is available:
```rust
assert_eq!(Ok(1), rx.recv());
assert_eq!(Ok(2), rx.recv());
```

Because this is an `mpsc` channel, senders can be cloned. This is especially useful for sending from multiple threads:
```rust
for i in 0..10 {
    let tx = tx.clone();
    thread::spawn(move|| {
        tx.send(i).unwrap();
    });
}
```

And all the values will be recieved by the single receiver:
```rust
for i in 0..10 {
    assert_eq!(Ok(i), rx.recv());
}
```

Note that senders/receivers can be transferred across thread boundaries as long as `T` is thread safe as well:
```rust
impl<T: Send> Send for Sender<T>
impl<T: Send> Send for Receiver<T>
```

Any values sent after the receiver is dropped will be returned as an error:
```rust
drop(rx);
assert_eq!(tx.send(1), Err(mpsc::SendError(1)));
```

And if the sender is dropped, `recv` will return an error:
```rust
drop(tx);
assert_eq!(recv.recv(), Err(mpsc::RecvError));
```

Simple, right? Let's try writing one ourselves.

We can start by scaffolding out the `Sender`, `Receiver`, and `channel` function:

```rust
pub struct Sender<T> {}
pub struct Receiver<T> {}

pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    (Sender {}, Receiver {})
}
```

So what goes inside of `Sender` and `Receiver`? 

Well, we need need some sort of items list that is shared between both types. Let's start with a simple `Vec<T>`:

```rust
pub struct Sender<T> {
    inner: Inner<T>,
}

pub struct Receiver<T> {
    inner: Inner<T>,
}

struct Inner<T> {
    items: Vec<T>,
}
```

When we create a channel, we can simply pass the inner to both the sender and the receiver:

```rust
pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    let inner = Inner { items: Vec::new() };
    let sender = Sender { inner };
    let receiver = Receiver { inner };
    (sender, receiver)
}
```

Immediately, we run into a problem:
```rust
error[E0382]: use of moved value: `inner`
  --> src/lib.rs:16:31
   |
14 |     let inner = Inner { items: Vec::new() };
   |         ----- move occurs because `inner` has type `Inner<T>`, which does not implement the `Copy` trait
15 |     let sender = Sender { inner };
   |                           ----- value moved here
16 |     let receiver = Receiver { inner };
   |                               ^^^^^ value used here after move
```

The sender and the reciever can't *both* own the qeue - it has to be shared between them. Maybe we can fix this with references:
```rust
pub struct Sender<'a, T> {
    inner: &'a Inner<T>,
}

pub struct Receiver<'a, T> {
    inner: &'a Inner<T>,
}
```

And when we create the channel, we can simply pass a reference to the list to both types. Perfect!
```rust
pub fn channel<'a, T>() -> (Sender<'a, T>, Receiver<'a, T>) {
    let inner = Inner { items: Vec::new() };
    let sender = Sender { inner: &inner };
    let receiver = Receiver { inner: &inner };
    (sender, receiver)
}
```

Except.. that doesn't work either:
```rust
error[E0515]: cannot return value referencing local variable `inner`
  --> src/lib.rs:18:5
   |
16 |     let sender = Sender { inner: &inner };
   |                                  ------ `inner` is borrowed here
17 |     let receiver = Receiver { inner: &inner };
18 |     (sender, receiver)
   |     ^^^^^^^^^^^^^^^^^^ returns a value referencing data owned by the current function

error[E0515]: cannot return value referencing local variable `inner`
  --> src/lib.rs:18:5
   |
17 |     let receiver = Receiver { inner: &inner };
   |                                      ------ `inner` is borrowed here
18 |     (sender, receiver)
   |     ^^^^^^^^^^^^^^^^^^ returns a value referencing data owned by the current function
```

Now, *no one* owns the list. And because it will be dropped at the end of the function, we can't return references to it. Hmm... what if, say.. the `Sender` *owns* the items, and the reciever gets a reference to them? That kind of make sense:
```rust
pub struct Sender<T> {
    inner: Inner<T>,
}

pub struct Receiver<'a, T> {
    inner: &'a Inner<T>,
}

pub fn channel<'a, T>() -> (Sender<T>, Receiver<'a, T>) {
    let sender = Sender {
        inner: Inner { list: Vec::new() },
    };
    let receiver = Receiver {
        inner: &sender.inner,
    };
    (sender, receiver)
}
```

Except, that doesn't work either:
```rust
error[E0515]: cannot return value referencing local data `sender.inner`
  --> src/lib.rs:17:5
   |
16 |     let receiver = Receiver { inner: &sender.inner };
   |                                      ------------- `sender.inner` is borrowed here
17 |     (sender, receiver)
   |     ^^^^^^^^^^^^^^^^^^ returns a value referencing data owned by the current function

error[E0505]: cannot move out of `sender` because it is borrowed
  --> src/lib.rs:17:6
   |
14 | pub fn channel<'a, T>() -> (Sender<T>, Receiver<'a, T>) {
   |                -- lifetime `'a` defined here
15 |     let sender = Sender { inner: Inner { items: Vec::new() }};
16 |     let receiver = Receiver { inner: &sender.inner };
   |                                      ------------- borrow of `sender.inner` occurs here
17 |     (sender, receiver)
   |     -^^^^^^-----------
   |     ||
   |     |move out of `sender` occurs here
   |     returning this value requires that `sender.inner` is borrowed for `'a`
```

That error is pretty confusing. Why doesn't this work? Let's try thinking about what is happening in the channel function from a *memory address* perspective:
```rust
let sender = Sender { inner: Inner { items: Vec::new() }};
// `sender` lives at address 0x1000

let receiver = Receiver { inner: &sender.inner };
// `receiver` lives at address 0x2000
// `receiver.inner` points to address 0x1000

(sender, receiver)
// the return value lives at address 0x3000
// `sender` is moved to address 0x3000
// `receiver` is also moved to address 0x3000
// but `receiver.inner` still points to address 0x1000!
```

What happens to `receiver`? It still contains a reference that points to the *old* location of sender. What would happen if someone tried to read the list? This is a classic self-referential struct problem.

In this case, we don't really even want a self-referential struct. What we really want is for *both* types to own the list. We can do this with a reference counted pointer.

The idea behind a reference counted pointer is pretty simple. You pass it a type `T`, which it allocates on the heap. It then provides you access to a reference to that values (`&T`). Cloning the pointer does not clone the inner value, it simply increments the reference count and returns you another pointer to the same `T`. Every time a reference is dropped, the ref count is decreased. When the last reference is dropped (the reference count is 1), the allocation is also dropped:
```rust
pub struct Rc<T>(*const Inner<T>);

struct Inner<T> { 
    val: T, 
    count: Cell<usize> 
}

impl<T> Clone for Rc<T> {
    fn clone(&self) -> Self {
        // increment the ref count
        unsafe { &*self.0 }.count.update(|x| x + 1);
        // return a pointer
        Rc(self.0)
    }
}

impl<T> Drop for Rc<T> {
    fn drop(&mut self) {
        let count = unsafe { &(*self.0).count };
        if count.get() == 1 {
            // we are the last reference
            unsafe { drop(ptr::read(self.0)) }
        } else {
            // there are still others
            // decrement the ref count
            count.update(|x| x - 1);
        }
    }
}
```

Seems pretty simple. However, the problem with `Rc` is that is not thread safe, which is problematic for a channel meant to provide thread safe communication. Instead, we can use an `Arc`, which is an atomic version of an `Rc`. It's implementation is the same except that it uses an atomic counter, providing thread safety.

Let's try to use an `Arc` in our channel implementation:
```rust
use std::sync::Arc;

pub struct Sender<T> {
    inner: Arc<Inner<T>>,
}

pub struct Receiver<T> {
    inner: Arc<Inner<T>>,
}

struct Inner<T> {
    items: Vec<T>,
}

pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    let inner = Arc::new(Inner { items: Vec::new() });
    let sender = Sender {
        inner: inner.clone(),
    };
    let receiver = Receiver {
        inner: inner.clone(),
    };
    (sender, receiver)
}
```

That compiles, perfect!

Let's try to write the `send` method. All it does is take an item, and push it to the shared vec:
```rust
impl<T> Sender<T> {
    pub fn send(&mut self, item: T) {
        self.inner.items.push(item);
    }
}
```

Except... we can't push to the vec:
```rust
error[E0596]: cannot borrow data in an `Arc` as mutable
 --> src/lib.rs:5:9
  |
5 |         self.inner.items.push(item);
  |         ^^^^^^^^^^^^^^^^ cannot borrow as mutable
  |
  = help: trait `DerefMut` is required to modify through a dereference, but it is not implemented for `Arc<Inner<T>>`
```

Why can't we mutate through the `Arc`? Well, having multiple mutable references to something is problematic, especially in mult-threaded scenarios. What would happen if two senders tried to push items to the list at the same time?

To solve this issue, we can wrap the items in a `Mutex`:
```rust
use std::sync::Mutex;

struct Inner<T> {
    items: Mutex<Vec<T>>,
}

pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    let inner = Arc::new(Inner {
        items: Mutex::new(Vec::new()),
    });
    // ...
}
```

Now, when we push to the list, we first `lock` the `Mutex`.
```rust
impl<T> Sender<T> {
    pub fn send(&mut self, item: T) {
        let mut items = self.inner.items.lock().unwrap();
        items.push(item);
    }
}
```

Locking a mutex guarantees exclusive access to it's contents, allowing us to mutate it. Anyone else trying to access it will have to wait until we finish.

The `recv` method simply removes the first element from the list, and returns it:
```rust
impl<T> Receiver<T> {
    pub fn recv(&mut self) -> T {
        let mut items = self.inner.items.lock().unwrap();
        items.remove(0)
    }
}
```

One problem here is that removing the first element from a `Vec` is very inefficient, as it has to shift all the remaining elements over to fill the empty spot.

Instead of using a `Vec`, we can use a `VecDeque`:
```rust
struct Inner<T> {
    items: Mutex<VecDeque<T>>,
}

pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    let inner = Arc::new(Inner {
        items: Mutex::new(VecDeque::new()),
    });
    // ...
}
```

For our purposes, a `VecDeque` (ring buffer) is more efficient. Instead of reshuffling the elements around, it simply adjusts a head and tail pointer, which keep track of the first and last elements seperately:
```rust
impl<T> Sender<T> {
    pub fn send(&mut self, item: T) {
        let mut items = self.inner.items.lock().unwrap();
        // push to the back of the queue
        items.push_back(item);
    }
}

impl<T> Receiver<T> {
    pub fn recv(&mut self) -> T {
        let mut items = self.inner.items.lock().unwrap();
        // pop from the front of the queue 
        items.pop_front()
    }
}
```

This feels much cleaner now - we shouldn't have been using a `Vec` as a queue in the first place. There is still a problem with out `recv` method however.
```rust
error[E0308]: mismatched types
  --> src/lib.rs:22:9
   |
19 | impl<T> Receiver<T> {
   |      - this type parameter
20 |     pub fn recv(&mut self) -> T {
   |                               - expected `T` because of return type
21 |         let mut items = self.inner.items.lock().unwrap();
22 |         items.pop_front()
   |         ^^^^^^^^^^^^^^^^^ expected type parameter `T`, found enum `Option`
```

If the queue is empty, `pop_front` will return `None`. But *we* don't want to return `None` because the whole point of a channel is that you can wait for the next message. 

One potential solution here is to stick `pop_front` in a loop. If an item is available, we return it. Otherwise, we try again.
```rust
impl<T> Receiver<T> {
    pub fn recv(&mut self) -> T {
        let mut items = self.inner.items.lock().unwrap();
        loop {
            match items.pop_front() {
                Some(item) => return item,
                None => continue
            }
        }
    }
}
```

There are a couple problems with this. The first, is that `Mutex` is a *mutual exclusion* lock. Calling `lock` returns a *guard* wrapping the inner value that notifies the mutex when it is dropped, which then allows someone else to take the guard. This means that you *cannot* have two places access the inner value at the same time:
```rust
use std::sync::Mutex;

fn main() {
    let mu = Mutex::new("foo");
    
    let one = mu.lock().unwrap();
    let two = mu.lock().unwrap();
}
```

The above code is an example of a *deadlock*. We first lock the mutex and store it in `one`. `two` then tries to lock the same mutex. Because `one` is still holding the guard, `two` waits until the guard is dropped, which never happens, so the program is stuck.

Our `recv` implementation has a similar problem. It takes the mutex guard and then loops forever until a value is available *while* holding the guard. This is problematic because `Sender` also needs the lock to send a value, but if `recv` is holding the lock, `tx.send` will never return - deadlock:

```rust
fn main() {
    let (tx, rx) = channel::<u8>();

    // spawn a new thread that receives *one* item
    let handle = std::thread::spawn(move || {
        // lock the mutex
        let mut items = rx.inner.items.lock().unwrap();

        // loop forever until an item is available
        loop {
            match items.pop_front() {
                Some(item) => { dbg!(item) },
                None => continue
            }
        }
    });

    // sleep for 7 seconds in the current thread
    std::thread::sleep(std::time::Duration::from_secs(7));

   
    // lock the mutex - this will never return because
    // the receiving thread is still holding the guard
    // while looping forever
    // DEADLOCK
    let mut items = tx.inner.items.lock().unwrap();

    items.push_back(100);

    handle.join().unwrap();
}
```

We can solve this by locking the mutex *inside* the loop:
```rust
impl<T> Receiver<T> {
    pub fn recv(&mut self) -> T {
        loop {
            let mut items = self.inner.items.lock().unwrap();
            match items.pop_front() {
                Some(item) => return item,
                None => continue
            }
        }
    }
}
```

Now the guard will be dropped inside the loop, allowing a sender to take the guard in-between iterations.

While this fixes the concurrency bug described above, a busy loop is not the most efficient solution.

Our channel implementation now works!

```rust
fn main() {
    let (mut tx, mut rx) = channel();
    std::thread::spawn(move|| {
        tx.send(10);
    });
    assert_eq!(rx.recv(), 10);
    println!("🎉🎉🎉");
}

// $ cargo run
// Compiling tmmmm v0.1.0 (/home/ibraheem/dev/rust/tmmmm)
// Finished dev [unoptimized + debuginfo] target(s) in 0.23s
// Running `target/debug/tmmmm`
// 🎉🎉🎉
```
