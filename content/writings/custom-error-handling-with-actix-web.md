---
template: writing.html
title: Secure Error Handling With Actix-Web
slug: actix-web-secure-error-handling
draft: false
date: 2020-10-15T21:37:15.944Z
description: Secure error responses for Rust and Actix-Web with no external crates.

taxonomies:
    tags:
        - Rust
        - Actix-Web

extra:
    socialImage: /actix-web-logo.png
---
### Introduction


Imagine someone made an api call, logging into their account with a misspelled email address:

```rust
curl --data { "email": "jJohn@example.org", "password" : "asdf1234" }
```

Imagine if they got this response:

```json
{ 
  "error": "passwords do not match, expected sS#*)!MS1$, found asdf1234",
  "details": {
      "email": "jJohn@example.org",
      "phone": "404 873 9099",
      "address": "1234 baker street",
      "password": "sS#*)!MS1$"
  }
}
```

Although you might not think about it often, it is very possible for your application to leak sensitive data through error messages, In this post, I will walk you through how I handle error messages in my Rust (actix-web) web applications.

### Custom Error Type

In my web apps, I create a simple trait that defines the status code and body of the response:

```rust
trait ResponseError {
    const STATUS: StatusCode;
    
    fn body<'a>(&self) -> Option<Cow<'a, str>> {
        None
    }
}
```

I then create error types for every possible error that can occur:
```rust
#[derive(Debug)]
struct UserNotFound;

impl ResponseError for UserNotFound {
    const STATUS: StatusCode = StatusCode::NOT_FOUND;

    fn body<'a>(&self) -> Option<Cow<'a, str>> {
        Some("User not found".into())
    }
}

#[derive(Debug)]
struct InvalidLogin;

impl ResponseError for InvalidLogin {
    const STATUS: StatusCode = StatusCode::UNAUTHORIZED;

    fn body<'a>(&self) -> Option<Cow<'a, str>> {
        Some("Invalid login attempt".into())
    }
}
```

I then create a single enum that encompasses all of these errors, as well as a generic `Other` variant for convenience;
```rust
#[derive(Debug)]
enum Error {
    UserNotFound(UserNotFound),
    InvalidLogin(InvalidLogin),
    Other(Box<dyn std::error::Error>)
}
```

I implement for the standard `Error` trait for my error type. If there is an underlying error, that is returned as the `source`:

```rust
impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Other(source) => Some(source),
            _ => None
        }
    }
}
```

I also implement `fmt::Display`:

```rust
impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            UserNotFound => write!(f, "user not found"),
            InvalidLoginAttempt => write!(f, "invalid login attempt"),
        }
    }
}
```

### Actix-Web Response Error

For `actix_web` to be able to display the error response properly, the error type must implement the `ResponseError` trait. This is where we can customize how the error is displayed to the user:

```rust
use actix_web::http::StatusCode::*;
use actix_web::web::HttpResponse;

impl actix_web::ResponseError for MyError {
    fn status_code(&self) -> StatusCode {
        match *self {
            InvalidLoginAttempt => UNAUTHORIZED,
            _ => INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        match *self {
            Other(inner) => {
                
            }
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
      error: ResponseErrorKind::Message(msg),
    }
  }

  pub fn code(code: u16) -> Self {
    ResponseError {
      code,
      error: ResponseErrorKind::None,
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
