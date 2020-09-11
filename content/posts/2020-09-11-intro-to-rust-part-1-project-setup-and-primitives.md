---
template: post
title: "Intro to Rust - Part 1: Why Rust?"
slug: intro-to-rust-part-1
draft: true
date: 2020-09-11T16:53:35.714Z
mainTag: Intro To Rust
socialImage: /media/rust-logo.png
description: Part 1 of my Rust introduction. Today, we look at why you should
  consider Rust and some of the benefits it provides over other languages.
tags:
  - Intro To Rust
  - Rust
---
**Why should you learn Rust?**

Rust has been getting a lot of media attention recently. It has been [voted the most loved language](https://insights.stackoverflow.com/survey/2020#technology-most-loved-dreaded-and-wanted-languages) for five years running, and it [grew in use on Github](https://octoverse.github.com/#fastest-growing-languages) by **235%** from 2018 to 2019. Large companies such as Mozilla, Apple, Amazon, Facebook, Google, Twitter, and Microsoft have began adopting it in their codebases. So, why do so many people love Rust?

Rust was built to solve many of the hassles associated with other popular languages. Let's look at a couple of examples:

**Rust vs. Dynamic Languages**

Developers coming from dynamically typed languages will find it hard to argue the benefits of static typing. Static type definitions are even being added to many popular dynamic languages, such as javascript's [typescript](https://www.typescriptlang.org/), python's [type hints](https://github.com/python/mypy), and ruby's [rbs](https://github.com/ruby/rbs). Static languages are generally considered more "scalable" and better for larger codebases as the compiler does much of the work for you. Let's look at an example:

```ruby
def print_size(array)
  puts array.size
end
```

The code above takes an array and prints its size to the console. Simple, right? Let's test it out:

```ruby
$ print_size(user.first.name)
=> 6
```

But, what happens when the user did not provide a name?

```ruby
$ print_size(user.first.name)
=> NoMethodError (undefined method `size' for nil:NilClass)
```

Dynamic languages provide easy ways to mitigate this issue such as the `try` method, or ruby's safe navigation operator. However, a simple mistake like the one above can cause runtime errors that can be hard to debug without comprehensive test coverage. This problem even occurs in many statically typed languages in which any value can potentially be `Null`.

Rust solves this issue with optional types, and it's compiler will require you to handle the `None` case:

```rust
fn print_size(vector: Option<Vec<string>>) {
  match vector {
    Some(vector) => println!("{}", vector.len())
  }
}
```

Compiling this code results in an error:

```rust
error[E0004]: non-exhaustive patterns: `None` not covered
--> src/main.rs:6:11
  |
6 |  match vector {
  |  ^^^^^^ pattern `None` not covered
  |
  = help: ensure that all possible cases are being handled, 
    possibly by adding wildcards or more match arms
  = note: the matched value is of type
    `std::option::Option<std::vec::Vec<std::string::String>>`

For more information about this error, try `rustc --explain E0004`.

To learn more, run the command again with --verbose.
```

In Rust, the code above would never make it to production, and clients would never experience the error because the compiler is so strict. Also note how detailed the error message is, telling you the exact location, issue, and potential solution to the error.

Static typing also results in compiled code that executes faster as the compiler knows the exact data types that are in use, and therefore can produce optimized machine code. Static types also serve as documentation.

**Rust vs. Statically Typed Languages**

Rust does its best to get out of the developer's way when it comes to static typing. Rust has a very smart type inference engine. It looks not only at the type of the value expression during its initialization but also at how the variable is used afterwards to infer its type. However, Rust's use of type inference does not decrease its ability to provide detailed error messages at compile time. Here's an advanced example of type inference, straight from the [docs](https://doc.rust-lang.org/stable/rust-by-example/types/inference.html).

```rust
fn main() {
  // Because of the annotation, the compiler knows that 
  // `elem` has type u8.
  let elem = 5u8;

  // Create an empty vector (a growable array).
  let mut vec = Vec::new();
  // At this point the compiler doesn't know the exact type of 
  // `vec`, it just knows that it's a vector of something (`Vec<_>`).

  // Insert `elem` in the vector.
  vec.push(elem);
  // Aha! Now the compiler knows that `vec` is 
  // a vector of `u8`s (`Vec<u8>`)

  println!("{:?}", vec);
}
```

No type annotation of variables was needed, the compiler is happy and so is the programmer!

**Rust vs. Garbage Collected Languages**

Garbage collection is an automatic memory management system that looks for unused variables and frees their memory. This can introduce performance issues at scale. 

For example, [Discord](https://discord.com/) used Golang, a garbage collected language, for keeping track of which channels and messages a user read, which they call "Read States". They began experiencing latency and CPU spikes consistently every 2 minutes. This is because Go will force a garbage collection run every 2 minutes, scanning the entire LRU cache to determine which memory needed to be handled by GC.

Here is a before and after of them switching from Go, to Rust. Go is purple, Rust is blue.

![](/media/rustvsgo-discord.png)

Read the full post here: [Why Discord is Switching from Go to Rust](https://blog.discord.com/why-discord-is-switching-from-go-to-rust-a190bbca2b1f)

Why is Rust so much better? Rust is blazingly fast and memory-efficient without needing a garbage collector, due to its ownership model.

```rust
// s is not valid here, it’s not yet declared
{
  let s = "hello"; // s is valid from this point forward
  // do stuff with s
}
// this scope is now over, s is no longer valid 
// and will be freed from memory
```

Thanks to Rust's ownership tracking, the lifetime of ALL memory allocated by a program is strictly tied to one (or several) function variables, which will ultimately go out of scope. This also allows Rust to determine when memory is no longer needed and can be cleaned up at compile time, resulting in efficient usage of memory *and* more performant memory access. 

[Skylight](https://www.skylight.io/), an early adopter of Rust was able to [reduce their memory usage](https://www.rust-lang.org/static/pdfs/Rust-Tilde-Whitepaper.pdf) from 5GB to 50MB by rewriting certain endpoints from Java to Rust.

**Rust vs. Other Systems Programming Languages**

Rust was build by Mozilla to be a the next step in the evolution of C or C++, two other systems programming languages. Rust gives you the low level control, while still providing features and conveniences that make it feel like a high-level languages. It gives you the technical power without allowing it to degrade from the developer experience.

Unlike something like Ruby, which disregards performance for developer experience, Rust provides as many *zero-cost abstractions* as possible; abstractions that are as performant as the equivalent hand-written code. Let's look at iterators for example:

```rust
let squares: Vec<_> = (0..10).map(|i| i * i).collect();
```

And the equivalent code in C:

```c
int squares[10];
for (int i = 0; i < 10; ++i)
{
  squares[i] = i * i;
}
```

As you can see, Rust can be used create a vector containing the first ten square numbers much more concisely than C, but still highly performant.

Rust also has a second language hidden inside it that doesn’t enforce memory safety guarantees: it’s called *unsafe Rust* and works just like regular Rust, but gives you extra capabilities. If you can't do something in safe Rust, you can implement it yourself, or, chances are, someone else has already done it, which brings me to my next point.

**The Rust Ecosystem**

Rust has become larger than just a language, it has a large ecosystem supporting it.

You can manage multiple installations and easily switch between stable, beta, and nightly compilers with [rustup](https://rustup.rs/). It also makes cross compiling between multiple platforms simpler.

Rust also provides [cargo](https://doc.rust-lang.org/cargo/), a tool for managing a Rust packages dependencies, running tests, generating documentation, compiling your package. Rust packages or "crates" created with cargo can be published to [crates.io](https://crates.io/) and made available for use by anyone. There are currently almost 50,000 available crates, and over 3.5 Billion downloads! Any library published to crates.io will have its documentation automatically built and published to [docs.rs](https://github.com/rust-lang/rustup).

Unlike many languages, there is an official tool for formatting Rust code in [rustfmt](https://github.com/rust-lang/rustfmt), as well as [clippy](https://github.com/rust-lang/rust-clippy), the linter that helps catch common mistakes and improve your code.

Rust has a very welcoming community. You can reach out through the [discord chat](https://discord.com/invite/rust-lang), [forum](https://users.rust-lang.org/), [subreddit](https://www.reddit.com/r/rust/), [stackoverflow tag](https://stackoverflow.com/questions/tagged/rust), [slack channel](https://rust-slack.herokuapp.com/), or [gitter](https://gitter.im/rust-lang/rust).

There are a ton of opensource projects created by the community. From web frameworks such as [actix web](https://github.com/actix/actix-web), [yew](https://github.com/yewstack/yew), and [rocket](https://github.com/SergioBenitez/Rocket), to Rust based text editors like [remacs](https://github.com/remacs/remacs) and [xi editor](https://github.com/xi-editor/xi-editor). Even [the language itself](https://github.com/rust-lang/rust) is opensource, and has 50,000 stars and over 3,000 contributors.

For a full list of resources, see [Awesome Rust](https://github.com/rust-unofficial/awesome-rust), a curated list of Rust code and resources.

**Getting Started**

In the part 2 of this series, we will look at setting up a Rust development environment and created our first Rust package with cargo.