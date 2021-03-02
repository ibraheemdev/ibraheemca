---
template: post
title: Secure Error Handling With Actix-Web
slug: actix-web-secure-error-handling
socialImage: /media/actix-web.png
draft: false
date: 2020-10-15T21:37:15.944Z
description: Secure error responses for Rust and Actix-Web with no external crates.
mainTag: Rust
tags:
  - Rust
  - Actix-Web
---
### Introduction

Imagine someone made an api call, logging into their account with a misspelled email address:

```rust
curl --data { "email": "jJohn@example.org", "password" : "asdf1234" }
```

Imagine if they got this response:

```rust
{ "error": "passwords do not match for User {
  email: jJohn@example.org,
  phone: 404 873 9099,
  address: 1234 baker street,
  password: sS#*)!MSJ(09adAHD's}io#
} "}
```

Although you might not think about it often, it is very possible for your application to leak sensitive data through error messages, In this post, I will walk you through how I handle error messages in my Rust (actix-web) web applications.

### Custom Error Type

In my Rust applications, I generally like to have a single error type for each domain that encompasses all the possible errors that can occur:

```rust
#[derive(Debug)]
pub enum MyError {
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
impl fmt::Display for MyError {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    match *self {
      MyError::Response(ref e) => e.fmt(f),
      MyError::Io(ref e) => e.fmt(f),
      MyError::Db(ref e) => e.fmt(f),
    }
  }
}
```

I then implement the `Into` conversion for each variant. This will allow the use of the `?` operator in functions that return `Result`:

```rust
impl From<db::error::Error> for MyError {
  fn from(err: db::error::Error) -> MyError {
    MyError::Db(err)
  }
}

impl From<std::io::Error> for Error {
  fn from(err: std::io::Error) -> MyError {
    MyError::Io(err)
  }
}
```

While there is a decent amount of boilerplate involved in this, I don't see the need to introduce a third-party crate for simple error conversions.

### Response Error

All of `MyError`'s variants are only used for internal logging. For actual error responses, only the `Response` variant is used. `Response` holds a custom `ResponseError` type:

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
{ "error": "The Error Message" }
```

### Actix-Web Response Error

For `actix_web` to be able to display the error response properly, the error type must implement the `actix_web::ResponseError` trait. `ResponseError` has two required methods, `status_code`, and `error_response`. 

The `status_code` method for the custom error type will either return the `Response` variant's status code, or 500 (internal server error):

```rust
use actix_web::http::StatusCode;

impl actix_web::ResponseError for MyError {
  fn status_code(&self) -> StatusCode {
    match *self {
      Error::Response(err) => StatusCode::from_u16(err.code).unwrap(),
      _ => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}
```

The `error_response` method will either return the json error message of the `Response` variant, or `{ "error": "An unexpected error occured" }`:

```rust
use actix_web::{dev::HttpResponseBuilder, http::StatusCode, HttpResponse};

impl actix_web::ResponseError for MyError {
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

Now I can create some convenience methods for constructing a new `ResponseError`:

```rust
impl ResponseError {
  pub fn message(code: u16, msg: &'static str) -> Self {
    ResponseError {
      code,
      error: ResponseErrorKind::Message(Some(msg)),
    }
  }

  pub fn code(code: u16) -> Self {
    ResponseError {
      code,
      error: ResponseErrorKind::Message(None),
    }
  }
}
```

### Usage

That's it for my error type. Now I can use it in my handlers. For example:

```rust
async fn hello() -> Result<HttpResponse, Error> {
  ResponseError::message(404, "Invalid Request")?
}
```

The above handler returns following json response:

```rust
[404] { "error": "Invalid Request" }
```

When making a sensitive database call, you can still use the `?` operator for cleaner error handling:

```rust
async fn login() -> Result<HttpResponse, Error> {
  make_sensitive_db_query()?
}
```

And no sensitive information will be leaked:

```rust
[500] { "error": "An unexpected error occured" }
```

If you want to add some additional context to an error, you can simply map it to a `ResponseError`:

```rust
async fn login() -> Result<HttpResponse, Error> {
  make_sensitive_db_query()
    .map_err(|_| ResponseError::message(401, "Invalid Login Attempt"))?
}
```

```rust
[401] { "error": "Invalid Login Attempt" }
```