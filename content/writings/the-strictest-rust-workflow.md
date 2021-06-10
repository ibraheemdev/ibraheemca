---
template: writing.html
title: The Strictest Rust Workflow
slug: strictest-cargo-workflow
draft: false
date: 2020-11-04T19:13:28.971Z
description: Make your code more idiomatic with clippy, safer with miri, and
  more consistent with rustfmt. AKA how to get Rust to yell at you even more

taxonomies:
    tags:
        - Rust

extra:
    socialImage: /rust-logo.png
---
The Rust compiler is known to be annoying. Sometimes, even trying to do the simplest thing will result in a compile time error. However, this is for good reason. Rust's borrow checker guarantees memory and thread-safety — enabling you to eliminate many classes of bugs at compile-time. In this article, I am going to try to create the strictest (most annoying) Rust workflow, making your code more idiomatic with [clippy](#clippy), safer with [miri](#miri), and more consistent with [rustfmt](#formatting).

## Building

The first step in our workflow is a simple `cargo check` with all the targets and features enabled:
```rust
$ cargo check --all-targets --all-features
```


## Clippy

Clippy is a community driven linter that helps catch common mistakes and improve your Rust code. For example, try linting this little program:
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
$ cargo clippy --all-targets --all-features
```
Now let's get into the configuration for the actual linting. 

Clippy has four lint levels:
```rust
-W --warn OPT       Set lint warnings
-A --allow OPT      Set lint allowed
-D --deny OPT       Set lint denied
-F --forbid OPT     Set lint forbidden
```
The strictest level is `forbid`. However, the forbid level is pretty limited. For example, let's say that you have a specific reason to use `.len() > 0` instead of `!is_empty`. With the `deny` lint level, you can explicitly tell clippy to not lint that comparison:
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

Clippy has linting *categories*. For example, `clippy:pedantic` enables the *really* strict lints, `clippy:cargo` tells clippy to check your manifest file, and `clippy:all` enables everything else. You can also tell clippy to fail when encountering warnings with `--forbid warnings`.

There is one more lint category, and that is `clippy::nursery`. These are lints that are in a *beta*, or unreleased stage.

Let's go ahead and enable all the available clippy lints at the `forbidden` lint level. Here is the final clippy command:
```rust
$ cargo clippy \
  --all-targets \
  --all-features \
  -- \
  --forbid warnings \
  --forbid clippy::all \
  --forbid clippy::pedantic \
  --forbid clippy::cargo \
  --forbid clippy::nursery
```

## Testing:

Testing in Rust is pretty straightforward. The most we can do here, is test all the compile targets, and enable all features:
```rust
$ cargo test --all-targets --all-features
```

## Formatting

Rustfmt is a tool for formatting Rust code according to style guidelines. It has hundreds of [configuration options](https://github.com/rust-lang/rustfmt/blob/master/Configurations.md) that can be set with a config file, or throught the command line. By default, it uses a style which conforms to the [Rust style guide](https://github.com/rust-dev-tools/fmt-rfcs/blob/master/guide/guide.md) that has been formalized through the [style RFC
process](https://github.com/rust-dev-tools/fmt-rfcs). We'll stick to the default formatting options for this article, but there are some other options we can enable. 

We can tell Rustfmt to format all packages (in a workspace):
```rust
$ cargo fmt --all
```

In the context of a CI workflow, you probably don't want rustfmt writing to the file system. Instead, we can tell it to run in 'check' mode, which exits with 0 if input is formatted correctly, and exits with 1 and prints a diff if formatting is required.
```rust
$ cargo fmt --all -- --check
```

## Miri

Miri is an experimental interpreter for [ust's
[mid-level intermediate representation](https://github.com/rust-lang/rfcs/blob/master/text/1211-mir.md).  It can run binaries and
test suites of cargo projects and detect certain classes of
[undefined behavior](https://doc.rust-lang.org/reference/behavior-considered-undefined.html),
for example:

* Out-of-bounds memory accesses and use-after-free
* Invalid use of uninitialized data
* Not sufficiently aligned memory accesses and references

On top of that, Miri will also tell you about memory leaks: when there is memory
still allocated at the end of the execution, and that memory is not reachable
from a global `static`, Miri will raise an error.

Miri has already discovered some [real-world bugs](https://github.com/rust-lang/miri/blob/master/README.md#bugs-found-by-miri) in the standard library! It is an amazing tool that is perfect for our workflow.

As of now, Miri is only available on the nightly release channel. For a CI workflow, that is totally fine, as we can install the latest nightly release and run Miri with nightly enabled within the workflow:
```rust
$ MIRI_NIGHTLY=nightly-$(curl -s https://rust-lang.github.io/rustup-components-history/x86_64-unknown-linux-gnu/miri)
$ rustup set profile minimal
$ rustup default "$MIRI_NIGHTLY"
$ rustup component add miri
```

Now you can run your test suite with the miri interpreter:
```rust
$ cargo miri test
```

As you probably guessed, Miri has a few configuration options that we can set to make our workflow even stricter. These can be enabled with the `MIRIFLAGS` environment variable:
```rust
export MIRIFLAGS="-Zmiri-symbolic-alignment-check -Zmiri-track-raw-pointers"
cargo miri test
```

The `symbolic-alignment-check` flag makes the alignment check more strict, and `track-raw-pointers` makes Stacked Borrows track a pointer tag even for raw pointers.

## Conclusion

That's all for our workflow. As you can tell, Rust's tooling is amazing! There are many official cargo components that you can use to make development easier. 

The final github workflow is available [here](/pages/todo).
