---
template: post
title: Why Developers Love Rust
slug: why-devs-love-rust
socialImage: /media/rust-logo.png
draft: false
date: 2020-09-11T16:53:35.714Z
description: Rust has been getting a lot of media attention recently. It has
  been voted the most loved language for five years running, and it grew in use
  on Github by 235% from 2018 to 2019. Large companies such as Mozilla, Apple,
  Amazon, Facebook, Google, Twitter, and Microsoft have began adopting it in
  their codebases. So, why do so many people love Rust?
mainTag: Rust
tags:
  - Rust
---
Rust has been getting a lot of media attention recently. It has been [voted the most loved language](https://insights.stackoverflow.com/survey/2020#technology-most-loved-dreaded-and-wanted-languages) for five years running, and it [grew in use on Github](https://octoverse.github.com/#fastest-growing-languages) by **235%** from 2018 to 2019. Large companies such as Mozilla, Apple, Amazon, Facebook, Google, Twitter, and Microsoft have began adopting it in their codebases. So, why do so many people love Rust?

Rust was built to solve many of the hassles associated with other popular languages. Let's look at a couple of examples:

#### **Memory Safety**

Rust focuses on speed and safety. It balances speed and safety through many ‘zero-cost abstractions’. This means that in Rust, abstractions cost as little as possible in order to make them work. The ownership system is a prime example of a zero cost abstraction. All of the analysis we’ll talk about in this section. You do not pay any run-time cost for any of these features.

To track the ownership of each value: a value can only be used at most once, after which the compiler refuses to use it again.

For example, the following code:
```rust
fn main() {
    let original = String::from("hello");
    takes_ownership(original);
    println!("{}", original)
} 

fn takes_ownership(other: String) {
    println!("{}", other);
} 
```

Yields an error:
```rust
error[E0382]: borrow of moved value: `original`
 --> src/main.rs:4:20
3 |   takes_ownership(original);
  |                     - value moved here
4 |   println!("{}", original)
  |                    ^ value borrowed here after mov
```

In the above code, the ownership of `original` was moved to the `take_ownership` function. Because the ownership was moved, Rust now cleans up the memory of `original`. Now, the compiler prevents you from using `original`. 

Rust's ownership model guarantees, at compile time, that your application will be safe from dereferencing null or dangling pointers This prevents the dreaded double-free regularly encountered in C or C++, along with many other memory related issues.

Rust also has a borrow checker. This means that functions can *borrow* ownership of a value. We can modify the example above to borrow `original`, instead of taking ownership:
```rust
fn main() {
    let original = String::from("hello");
    borrow_ownership(&original);
    println!("{}", original)
} 

fn borrow_ownership(other: &String) {
    println!("{}", other);
}
```

Now the code compiles. We call the &T type a ‘reference’. Instead of owning the resource, the function borrows ownership. A binding that borrows something does not deallocate the resource when it goes out of scope. This means that after the borrow, we can use our original bindings again.

Rust memory safety comes at the cost of complexity. New developers often complain that getting a program to compile can be quite difficult. It’s pretty common for newcomers to the Rust community to get stuck "fighting the borrow checker". As [Rust learner](https://news.ycombinator.com/item?id=23437202#unv_23437831) explained:

> "It's hard but I love it. Dealing with the compiler felt like being the novice in an old kung fu movie who spends day after day being tortured by his new master (rustc) for no apparent reason until one day it clicks and he realizes that he knows kung fu."

Fighting the borrow checker can be frustrating, but trust me, it's worth it. Rust is often compared to Haskell and Scala in the sense that if your code compiles, you can sleep at night without having to worry about runtime errors. This is even more true after looking at the memory safety Rust enforces through its ownership model.

Rust also has a second language hidden inside it that doesn’t enforce memory safety guarantees: it’s called *unsafe Rust*. Wrapping code with the `unsafe` block effectively tells the compiler to shut up, because you know what you are doing. Doing so gives you *unsafe superpowers*. For example, you can dereference a raw pointer:
```go
let mut num = 5;

let r1 = &num as *const i32;
let r2 = &mut num as *mut i32;

unsafe {
  println!("r1 is: {}", *r1);
  println!("r2 is: {}", *r2);
}
```

If you can't do something in safe Rust, you can implement it yourself with `unsafe`. However, `unsafe` should be used with caution. Abusing it can have unwanted consequences. Because of this, Rust forces you to explicitly mark code as unsafe. You cannot use an unsafe function in a safe block. Many developers even opt to mark there entire project with `![forbid(unsafe_code)]`.

#### **Rust vs. Dynamic Languages**

Developers coming from dynamically typed languages will find it hard to argue the benefits of static typing. Static type definitions are even being added to many popular dynamic languages, such as javascript's [typescript](https://www.typescriptlang.org/), python's [type hints](https://github.com/python/mypy), and ruby's [rbs](https://github.com/ruby/rbs). Static languages are generally considered more "scalable" and better for larger codebases as the compiler does much of the work for you. Let's look at an example:

```ruby
def silly(a)
  if a > 0
    puts 'hello'
  else
    print a + '3'
  end
end
```

The code above prints 'hello', right? Let's test it out:

```ruby
$ silly(2)
=> "hello"
```

But, when you pass a negative number:

```ruby
$ silly(-1)
=> TypeError (String can't be coerced into Integer)
```

You get a `TypeError` at runtime. 

A simple mistake like this can cause runtime errors that can be hard to debug without comprehensive test coverage. Since Rust is statically typed, all type errors will be caught at compile time, and this problem never occurs.

Static typing also results in compiled code that executes faster as the compiler knows the exact data types that are in use, and therefore can produce optimized machine code.

The points in this section apply to pretty much all strongly typed languages. Now let's look at some of the things Rust does differently than other statically typed languages.

#### **No Nulls**

Most languages have a concept of null. Any value can either be what you expect, or nothing at all. If you accidentally miss a null check, you code can blow up at runtime. Tony Hoare, the inventor of null references, calls it his his [Billion Dollar Mistake](https://www.youtube.com/watch?v=ybrQvs4x0Ps&ab_channel=JoseCan).

Rust, unlike most other languages, does not have a concept of null. It does not exist! If `x = 1`, then x *is* an integer, and will *always* be an integer.

Rust expresses optional values with an enum called `Option`: 
```rust
pub enum Option<T> {
    None,
    Some(T),
}
```

An `Option` is either nothing, or something. You can pattern match on an option to access the underlying value:
```rust
match x {
  None => handle_none(),
  Some(value) => return value
}
```

But what happens if you forget to check for `None`? Doesn't this pose the same problems as null? Rust solves this problem my enforcing exhaustive pattern matching. This means that this code, which does not check for `None`:

```rust
match x {
  Some(value) => println!("{}", value)
}
```

Will not compile:

```rust
error[E0004]: non-exhaustive patterns: `None` not covered
--> src/main.rs:6:11
  |
6 |  match x {
  |  ^^^^^^ pattern `None` not covered
  |
  = help: ensure that all possible cases are being handled, 
    possibly by adding wildcards or more match arms
```

In Rust, the code above would never make it to production, and clients would never experience the error because the compiler is so strict. Also note how detailed the error message is, telling you the exact location, issue, and potential solution to the error.

#### **Rust vs. Statically Typed Languages**

Rust does its best to get out of the developer's way when it comes to static typing. Rust has a very smart type inference engine. It looks not only at the type of the value expression during its initialization but also at how the variable is used afterwards to infer its type. However, Rust's use of type inference does not decrease its ability to provide detailed error messages at compile time. Let's see how that type inference works. We can start my initializing a integer:
```rust
let elem: u8 = 5;
```
Because of the annotation, the compiler knows that elem is of type u8. Now we can create a mutable vector (a growable array):
```rust
let mut vec = Vec::new();
```
At this point the compiler doesn't know the exact type of the vector. It just knows that it's a vector of something (`Vec<_>`). But once we insert the element into the vector
```rust
vec.push(elem);
```
Aha! Now the compiler knows that `vec` is a vector of u8's (`Vec<u8>`)

No type annotation of variables was needed, the compiler is happy and so is the programmer!

#### **Rust vs. Garbage Collected Languages**

Garbage collection is an automatic memory management system that looks for unused variables and frees their memory. It is a concept employed by many widely used languages, such as Java, Ruby, and Python. However, garbage collection can introduce performance issues at scale.

For example, [Discord](https://discord.com/) used Golang, a garbage collected language, for keeping track of which channels and messages a user read. They began experiencing latency and CPU spikes consistently every 2 minutes. This is because Go will force a garbage collection run every 2 minutes, scanning the entire LRU cache to determine which memory needed to be handled by GC.

Here is a before and after of them switching from Go, to Rust. Go is purple, Rust is blue.

![](/media/rustvsgo-discord.png)

Read the full post here: [Why Discord is Switching from Go to Rust](https://blog.discord.com/why-discord-is-switching-from-go-to-rust-a190bbca2b1f)

Why is Rust so much better? Rust is blazingly fast and memory-efficient without needing a garbage collector, due to its ownership model. Here is a simple example:

```rust
// s is not valid here, it’s not yet declared
{
  let s = "hello"; // s is valid from this point forward
  // do stuff with s
}
// this scope is now over, s is no longer valid 
// and will be freed from memory
```

Thanks to Rust's ownership tracking, the lifetime of ALL memory allocated by a program is strictly tied to one function, which will ultimately go out of scope. This also allows Rust to determine when memory is no longer needed and can be cleaned up at compile time, resulting in efficient usage of memory *and* more performant memory access. 

[Skylight](https://www.skylight.io/), an early adopter of Rust was able to [reduce their memory usage](https://www.rust-lang.org/static/pdfs/Rust-Tilde-Whitepaper.pdf) from 5GB to 50MB by rewriting certain endpoints from Java to Rust.

#### **Rust vs. Other Systems Programming Languages**

Rust was built by Mozilla to be a the next step in the evolution of C or C++, two other systems programming languages. Rust gives you the low level control, while still providing features and conveniences that make it feel like a high-level languages. It gives you the technical power without allowing it to degrade from the developer experience.

Unlike something like Ruby, which disregards performance for developer experience, or C, which takes a more barebones approach, Rust provides as many *zero-cost abstractions* as possible; abstractions that are as performant as the equivalent hand-written code.

For example, here is how you would create an array containing the first ten square numbers in C:

```c
int squares[10];
for (int i = 0; i < 10; ++i)
{
  squares[i] = i * i;
}
```

And the equivalent code in Rust, using [iterators](https://doc.rust-lang.org/std/iter/trait.Iterator.html):
```rust
let squares: Vec<_> = (0..10).map(|i| i * i).collect();
```

As you can see, Rust provides high level concepts with ergonomic interfaces, but is still highly performant.

#### **The Rust Ecosystem**

Rust has become larger than just a language, it has a large ecosystem supporting it.

You can manage multiple installations and easily switch between stable, beta, and nightly compilers with [rustup](https://rustup.rs/). It also makes cross compiling between multiple platforms simpler.

Rust also provides [cargo](https://doc.rust-lang.org/cargo/), a tool for managing a Rust packages dependencies, running tests, generating documentation, compiling your package. Rust packages or "crates" created with cargo can be published to [crates.io](https://crates.io/) and made available for use by anyone. There are currently almost 50,000 available crates, and over 3.5 Billion downloads! Any library published to crates.io will have its documentation automatically built and published to [docs.rs](https://github.com/rust-lang/rustup).

Unlike many languages, there is an official tool for formatting Rust code in [rustfmt](https://github.com/rust-lang/rustfmt), as well as [clippy](https://github.com/rust-lang/rust-clippy), the linter that helps catch common mistakes and improve your code.

Rust has an extremely friendly and welcoming community. This is a breath of fresh air coming from other languages, such as [insert unfriendly community here]. You can reach out through the [discord chat](https://discord.com/invite/rust-lang), [forum](https://users.rust-lang.org/), [subreddit](https://www.reddit.com/r/rust/), [stackoverflow tag](https://stackoverflow.com/questions/tagged/rust), [slack channel](https://rust-slack.herokuapp.com/), or [gitter](https://gitter.im/rust-lang/rust).

There are a ton of opensource projects created by the community. From web frameworks such as [actix web](https://github.com/actix/actix-web), [yew](https://github.com/yewstack/yew), and [rocket](https://github.com/SergioBenitez/Rocket), to Rust based text editors like [remacs](https://github.com/remacs/remacs) and [xi editor](https://github.com/xi-editor/xi-editor). Even [the language itself](https://github.com/rust-lang/rust) is opensource, and has 50,000 stars and over 3,000 contributors.

For a full list of resources, see [Awesome Rust](https://github.com/rust-unofficial/awesome-rust), a curated list of Rust code and resources.

#### **Rust and WebAssembly**

Another reason that people get so excited about Rust is how well it plays with WebAssembly. [Webassembly](https://webassembly.org/) is a binary instruction format that can run in most major browsers. It aims to execute at native speed by taking advantage of common hardware capabilities available on a wide range of platforms. Wasm can be run in the place of, or alongside traditional javascript, allowing developers to offload performance critical tasks from javascript, improving their application's performance without having to completely rewrite their existing codebase.

Rust can be compiled directly into WebAssembly and run in the browser with Cargo:

```rust
$ cargo build --target=wasm32-unknown-emscripten
```

This allows you to take advantage of all Rust's compile safety in the web. Since Rust lacks a runtime, generated `.wasm` files are very small because there is no extra bloat included like a garbage collector. Rust and WebAssembly integrates with existing javascript tooling. It supports ECMAScript modules and other tools such as npm packages and webpack.

There are some really cool Rust + Wasm projects out there. For example, [Yew](https://github.com/yewstack/yew) lets you create multi-threaded front-end web apps with Rust, in a way that feels almost like React.js.

For more information regarding Rust and WebAssembly, see the [rustwasm book](https://rustwasm.github.io/docs/book/introduction.html)

#### **Getting Started**

Hopefully you understand why Rust is such a beloved language by developers. To get started with learning Rust, you should check out [the Rust book](https://doc.rust-lang.org/book/). For other learning options and hands-on projects, [click here](https://www.rust-lang.org/learn)