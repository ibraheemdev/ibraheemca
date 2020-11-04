---
template: post
title: The Strictest Rust Workflow
slug: strictest-cargo-workflow
socialImage: /media/profile.png
draft: true
date: 2020-11-04T16:43:51.892Z
description: How to get the compiler to yell at you even more
mainTag: Rust
tags:
  - Rust
---
The Rust compiler is known to be annoying. Sometimes, even trying to do the simplest thing will result in a compile time error. In this article, I'm going to try to make the compiler as annoying as possible :)

### Clippy:

Clippy is a community driven linter that helps catch common mistakes and improve your Rust code. For example, linting this little program:
```rust
fn main() {
    let msg = "Hello";
    if msg.len() > 0 {
        println!("{}", msg)
    }
}
```
And clippy will complain:
```rust
error: length comparison to zero
 --> src/main.rs:3:8
  |
3 |     if msg.len() > 0 {
  |        ^^^^^^^^^^^^^ help: using `!is_empty` is clearer and more explicit: `!msg.is_empty()`
  |
```
Clippy has a couple of configuration options that can make it stricter. For starters, we can tell it to check all targets and activate all features:
```rust
cargo clippy --all-targets --all-features
```
Now let's get into the configuration for the actual linting. 

Clippy has four lint levels:
```rust
-W --warn OPT       Set lint warnings
-A --allow OPT      Set lint allowed
-D --deny OPT       Set lint denied
-F --forbid OPT     Set lint forbidden
```
The strictest level is `--forbid`. However, the forbid level is limited. For example, let's say that you have a specific reason to use `.len() > 0` instead of `!is_empty`. With the `deny` lint level, you can explicitly tell clippy to not lint that comparison:
```rust
#[allow(clippy::len_zero)]
fn main() {
    let msg = "Hello";
    if msg.len() > 0 {
        println!("{}", msg)
    }
}
```
But with `forbid`, Clippy will override your `allow`, and still fail the lint check. For the purposes of this article, we'll stick with the `forbid` level, but for most use cases, `deny` is probably a better option. 

Clippy has linting *categories*. For example, `clippy:pedantic` enables the *really* strict lints, `clippy:cargo` tells clippy to check your manifest file, and `clippy:all` enables everything else. 

There is one more lint category, and that is `clippy::nursery`. These are lints that are in a *beta*, or unreleased stage. Let's go ahead and enable those too. Here is the final clippy command:
```rust
cargo clippy \
  --all-targets \
  --all-features \
  -- \
  --forbid=clippy::all \
  --forbid=clippy::pedantic \
  --forbid=clippy::cargo \
  --forbid=clippy::nursery
```

