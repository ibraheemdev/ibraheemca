---
template: post
title: Custom Error Handling With Actix-Web
slug: "actix-web-error-handling "
socialImage: /media/actix-web.png
draft: true
date: 2020-10-15T21:37:15.944Z
description: Custom error responses with Rust and Actix-Web
mainTag: Rust
tags:
  - Rust
  - Actix-Web
---
In my Rust applications, I generally like to have a single error type for each domain that encompasses all the possible errors that can occur:
```rust
#[derive(Debug)]
pub enum Error {
  Response(ResponseError),
  Simple(&'static str),
  Io(std::io::Error),
  Validation(validator::ValidationErrors),
}
```
I implement for the standard `Error` trait for my error type:

```rust
impl std::error::Error for Error {}
```

As well as `fmt::Display`:
```rust
impl fmt::Display for Error {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    match *self {
      Error::Response(ref e) => e.fmt(f),
      Error::Io(ref e) => e.fmt(f),
      Error::Validation(ref e) => e.fmt(f),
      Error::Simple(ref e) => e.fmt(f),
    }
  }
}
```
I then implement the `Into` conversion for each variant:
```rust
impl From<validator::ValidationErrors> for Error {
  fn from(err: validator::ValidationErrors) -> Error {
    Error::Validation(err)
  }
}

impl From<std::io::Error> for Error {
  fn from(err: std::io::Error) -> Error {
    Error::Io(err)
  }
}
```
