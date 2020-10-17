---
template: post
title: Custom Error Handling With Actix-Web
slug: "actix-web-error-handling "
socialImage: /media/actix-web.png
draft: true
date: 2020-10-15T21:37:15.944Z
description: Custom error responses with Rust and Actix-Web, with no external crates.
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
  Io(std::io::Error),
  Db(db::error::Error),
}
```
I implement for the standard `Error` trait for my error type:

```rust
impl std::error::Error for Error {}
```

I also `fmt::Display` by simple calling `fmt()` on the respective enum variant:
```rust
impl fmt::Display for Error {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    match *self {
      Error::Response(ref e) => e.fmt(f),
      Error::Io(ref e) => e.fmt(f),
      Error::Db(ref e) => e.fmt(f),
    }
  }
}
```
I then implement the `Into` conversion for each variant:
```rust
impl From<db::error::Error> for Error {
  fn from(err: db::error::Error) -> Error {
    Error::Db(err)
  }
}

impl From<std::io::Error> for Error {
  fn from(err: std::io::Error) -> Error {
    Error::Io(err)
  }
}
```
While there is a decent amount of boilerplate involved in this, I don't see the need to introduce a third-party crate for simple error conversions.

All of the above errors are only used for internal logging. Obviously, I don't want to expose sensitive information in api endpoints. For actual error responses, only the `Response` variant is used. `Response` holds a custom `ResponseError` type:
```rust
#[derive(Debug)]
pub struct ResponseError {
  pub code: u16,
  pub error: ResponseErrorKind,
}
```

`ResponseError` is a struct which contains a status code and a `ResponseErrorKind`, which is also an enum. In this simple example, it contains one variant, which is a optional string message:
```rust
#[derive(Debug, Clone)]
pub enum ResponseErrorKind {
  Message(Option<&'static str>),
}
```

The `std::fmt::Display` implementation returns a json error response:
```rust
impl fmt::Display for ResponseError {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    match &self.error {
      ResponseErrorKind::Message(m) => match m {
        Some(m) => format!("{{ \"error\": {} }}", m).fmt(f),
        None => Ok(()),
      }
    }
  }
}
```
If the response error contains a message, it will display a json response that looks like this:
```rust
{ "error": "Invalid login attempt" }
```

For `actix_web` to be able to display the error response, the error type must implement the `actix_web::ResponseError` trait. `ResponseError` contains two required methods, `status_code`, and `error_response` . The `status_code` method for the custom error type will either return `ResponseError`'s status code, or 500 (internal server error):
```rust
use actix_web::http::StatusCode;

impl actix_web::ResponseError for Error {
  fn status_code(&self) -> StatusCode {
    match *self {
      Error::Response(err) => StatusCode::from_u16(err.code).unwrap(),
      _ => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}
```

The `error_response` method will either return the json error message of `Response Error`, or `{ "error": "An unexpected error occured" }`:
```rust
impl actix_web::ResponseError for Error {
  fn error_response(&self) -> HttpResponse {
    match *self {
      Error::Response(err) => HttpResponseBuilder::new(StatusCode::from_u16(err.code).unwrap())
        .content_type("application/json")
        .body(err.to_string()),
      _ => HttpResponseBuilder::new(StatusCode::INTERNAL_SERVER_ERROR)
        .content_type("application/json")
        .body("{{ \"error\": \"An unexpected error occured\" }}"),
    }
  }
}
```