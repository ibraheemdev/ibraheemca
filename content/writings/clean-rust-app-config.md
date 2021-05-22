---
template: writing.html
title: Clean App Config for Rust
slug: clean-rust-app-config
draft: false
date: 2020-09-22T16:01:02.408Z
description: Clean configuration management for your Rust apps.
taxonomies:
    tags:
        - Rust
        - Configuration
        - YAML

extra:
    socialImage: /rust-logo.png
---
*I recently posted [Clean App Config for Go](https://ibraheem.ca/posts/go-global-config-files), and thought I would try to replicate that article in Rust.*

When developing an application, it is common to have configuration data that is used throughout the app. This data can include an http host and port or a database connection url. These configuration variables can change between environments. For example, you might be using a PostgresQL database in production and development, and SQlite in testing. It is considered best practice to put these config variables in a single source of truth, often in environment variables or config files. Doing this makes your app easier to manage and update than hardcoding strings. 

In this post, we will be going over configuration in Rust applications through environment based YAML files. We can start by creating a new binary Rust application:

```rust
cargo new --bin myapp
```

Add the necessary dependencies:

```rust
// Cargo.toml
[dependencies]
serde = { version = "1.0.116", features = ["derive"] }
serde_yaml = "0.8"
lazy_static = "1.4.0"
```

We will be using `serde`, the most popular Rust serialization framework, and `lazy_static`, a macro for declaring lazily evaluated statics in Rust. We will get to these later.

In this application, we will have three environments. `testing`, `development`, and `production`. You can create yaml files for each of these environments in a `config/` directory at the root of your project:

```rust
|-- config
   |-- development.yml
   |-- production.yml
   |-- testing.yml
```

We can fill the yaml files with configuration variables. In this example, the config files will simply contain the database user, password, host, port, and name.

```yaml
database:
  user: ""
  password: ""
  host: "localhost"
  port: 8080
  name: "myapp"
```

The `config.rs` file will contain the logic for deserializing and storing the configuration variables in a `Config` struct. It stores the application's configuration as a global variable. That way, any module that needs access can use the config module, and access the application's configuration variables.

In this example, all of our config files contain the same variables, so we can define a single type, `Config`, that contains fields and embedded structs corresponding to the yaml config file.

```rust
// src/config.rs

use serde::Deserialize;
use std::{env, fs, io};

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
  database: DatabaseConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
  user: String,
  password: String,
  host: String,
  port: i32,
  database: String,
}
```

Note the use of the `#[derive]` attribute. `#[derive]` tells the compiler to provide a struct with basic implementations of a trait. Here, we are deriving three attributes:

* `Debug`: For use with the `println!` macro
* `Deserialize`: This will allow Serde to deserialize the yaml files into the Config struct
* `Clone`: Allows the Config type to be copyable

We need a way to get the current environment (production, development, testing) of our application. We can store this as an environment variable.

```env
APP_ENV=development
```

To get the environment variable, we can use the `std::env` package:

```rust
// src/config.rs

...
use std::{env};
...

impl Config {
  pub fn get_environment() -> Result<String, env::VarError> {
    env::var(APP_ENV)
  }
}
```

To start your application in a specific environment, you can set the environment variable at runtime:

```bash
$ APP_ENV=development cargo run
```

We now need to read the appropriate configuration into memory. Rust has a convenient `read_to_string` function in the standard library for this:

```rust
// src/config.rs

...
use std::{env, fs};
...

impl Config {
  pub fn read_config_file(env: &str) -> Result<String, io::Error> {
    fs::read_to_string(format!("{}{}.yml", CONFIG_DIR, env))
  }

  ...
}
```

Let's test this out:

```rust
// reference the ./config.rs file
mod config;

fn main() {
    let string = config::Config::read_config_file("testing").unwrap();
    println!("{}", string);
}
```

And it works:

```rust
$ cargo run
...

=> database:
     user: ""
     password: ""
     host: "localhost"
     port: 8080
     database: "myapp"
```

Perfect! Now, we can use `serde` to serialize that string into the `Config` struct. Let's write this logic in an `init` function:

```rust
fn init() -> Self {
  ...
}
```

Inside this function, we can get the current environment:

```rust
let env = Config::get_environment();
```

If the environment is not valid, we have to handle that error. This function will be executed on application startup, so panicking is fine here:

```rust
let env = match env {
  Ok(e) => match e.as_ref() {
    "development" | "testing" | "production" => e,
    _ => panic!("Must set {} to valid environment", APP_ENV),
  },
  Err(_) => panic!("Must set {} to valid environment", APP_ENV),
};
```

Alternatively, you could default to the `development` environment. This is common in other frameworks:

```rust
let env = match env {
  Ok(e) => match e.as_ref() {
    "development" | "testing" | "production" => e,
    _ => String::from("development"),
  },
  Err(_) => String::from("development"),
};
```

Next, we can read the config file and panic if there is an error:

```rust
let contents = Self::read_config_file(env.as_ref()).unwrap();
```

And finally, we use the `serde_yaml` crate to serialize the string into the `Config` struct:

```rust
return serde_yaml::from_str(&contents).unwrap();
```

Here is the final `init` function:

```rust
fn init() -> Self {
  let env = Config::get_environment();
  let env = match env {
    Ok(e) => match e.as_ref() {
      "development" | "testing" | "production" => e,
      _ => String::from("development"),
    },
    Err(_) => String::from("development"),
  };

  let contents = Self::read_config_file(env.as_ref()).unwrap();
  return serde_yaml::from_str(&contents).unwrap();
}
```

Now we just have to store `Config` in a global variable. You might think we can use a constant:
```rust
const CONFIG: Config = Config::init();
```

However, this is not possible in Rust:
```rust
error[E0015]: calls in constants are limited to 
constant functions, tuple structs and tuple variants
  --> src/config.rs:21:24
   |
21 | const CONFIG: Config = Config::init();
   |  
```

What about a static variable?
```rust
static CONFIG: Config = Config::init();
```

Nope:
```rust
error[E0015]: calls in statics are limited to 
constant functions, tuple structs and tuple variants
  --> src/config.rs:21:25
   |
21 | static CONFIG: Config = Config::init();
   |   
```

So... let's just make `init` a constant function. Problem solved, right?
```rust
const fn init() -> Self {
  ...
}

pub const fn get_environment() -> Result<String, env::VarError> {
  ...
}
```

Nope. A constant function can only call other constant functions. Because that is not the case with `init()`, this code will not compile:
```rust
error[E0723]: can only call other `const fn` 
within a `const fn`, but `const std::env::var::<&str>` 
is not stable as `const fn`
  --> src/config.rs:58:5
   |
58 |     env::var(APP_ENV)
   |     ^^^^^^^^^^^^^^^^^
   |
```

Thankfully, there is an easy way to deal with runtime (lazy) global variable initialization, provided by the `lazy_static` crate:
```rust
// src/main.rs

#[macro_use]
extern crate lazy_static;
```

We'll call this variable, `CONFIG`:
```rust
lazy_static! {
  static ref CONFIG: Config = Config::init();
}
```

Now, we have to provide a function to access this variable:
```rust
impl Config {
  ...
  pub fn get() -> Self {
    CONFIG.to_owned()
  }
}
```

And that's it! Let's test it out:
```rust
// src/main.rs
mod config;
mod error;

#[macro_use]
extern crate lazy_static;

fn main() {
  let config = config::Config::get();
  println!("{:#?}", config);
}
```

```rust
$ cargo run

=> Config {
  database: DatabaseConfig {
    user: "",
    password: "",
    host: "localhost",
    port: 8080,
    database: "myapp",
  },
}
```

All of the code from this post is available on [github](https://gist.github.com/ibraheemdev/be443a33e305946abe4866846fb3d086).

# But Aren't Global Variables Bad?

It's true that global variables should generally be avoided. The rust compiler makes it especially hard due to memory safety concerns with globals. However, for specific things, they are the cleanest solution. Without a global variable, configuration just ends up cluttering your app, when the configuration itself is inherently global. If you are using a framework and it provides an app state solution (such as actix-web), then by all means, use that instead. But in other cases, globals work just fine.
