---
template: post
title: Rust Global Configuration Files with Multiple Environments
slug: rust-global-config-files
socialImage: /media/profile.png
draft: true
date: 2020-09-22T16:01:02.408Z
description: A simple way to decode configuration files based on the current
  application environment into globally accessible variables
mainTag: Rust
tags:
  - Rust
  - Configuration
  - YAML
---
I recently posted [Golang Global Configuration Files](https://ibraheem.ca/posts/go-global-config-files)

When developing an application, it is common to have configuration data that is used throughout the app. This data can include an http host and port or a database connection url. These configuration variables can change between environments. For example, you might be using a PostgresQL database in production and development, and SQlite in testing. It is considered best practice to put these config variables in a single source of truth, often in environment variables or config files. Doing this makes your app easier to manage and update than hardcoding strings. 

In this post, we will be going over configuration in Rust applications through environment based YAML files. We can start by creating a new binary Rust application:

```rust
cargo new --bin myapp
```

Add the necessary dependencies:

```rust
// Cargo.toml[package]
[dependencies]
serde = { version = "1.0.116", features = ["derive"] }
serde_yaml = "0.8"
lazy_static = "1.4.0"
```

We will be using `serde`, the most popular Rust serialization framework, and `lazy_static`, a macro for declaring lazily evaluated statics in Rust. We will get these later.

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

```go
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
     database: "mytribe"
```

Perfect! Now, we can use `serde` to serialize that string into the `Config` struct. Let's write this logic in an `init` function:

```rust
fn init() -> Self {
  let env = Config::get_environment();
  let env = match env {
    Ok(e) => match e.as_ref() {
      "development" | "testing" | "production" => e,
      _ => panic!("Must set {} to valid environment", APP_ENV),
    },
    Err(_) => panic!("Must set {} to valid environment", APP_ENV),
  };

  let contents = Self::read_config_file(env.as_ref()).expect("File not found");
  return serde_yaml::from_str(&contents).expect("Error while reading json");
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

Alternatively, you could default to the `development` environment as is common in other frameworks:

```rust
let env = match env {
  Ok(e) => match e.as_ref() {
    "development" | "testing" | "production" => e,
    _ => "development",
  },
  Err(_) => "development",
};
```

```go
package config

import (
  "fmt"
  "os"
)
...

func readConfig() *EnvironmentConfig {
  file := fmt.Sprintf("config/environments/%s.yml", getEnv())
  f, err := os.Open(file)
  if err != nil {
    log.Fatal(err)
    os.Exit(2)
  }
  defer f.Close()
}
```

It uses the os package to open the config file corresponding to the current environment. Now we can use the [yaml.v3](https://github.com/go-yaml/yaml) package to decode the file into an EnvironmentConfig struct and return a pointer:

```go
func readConfig() *EnvironmentConfig {
  ...
  var cfg EnvironmentConfig
  decoder := yaml.NewDecoder(f)
  err = decoder.Decode(&cfg)
  if err != nil {
    log.Fatal(err)
    os.Exit(2)
  }
  return &cfg
}
```

The config package is done! Now in your application's main.go, you can import the config package with a blank identifier:

```go
package main

import (
  _ "github.com/yourapp/config"
)

...
```

The blank identifier is used to import a package solely for its side-effects (initialization), meaning that we are only using the config package for its init function. If you remember, the init function assigns the Config global variable to a pointer of an EnvironmentConfig struct. 

This means that the Config struct is now accessible to your entire application. For example, you can use the http host and port variables in your router's ListenAndServer function:

```go
import (
  "fmt"
  "log"
  "net/http"
  "github.com/yourapp/config"
)


// ListenAndServe :
func ListenAndServe() {
  log.Fatal(
    http.ListenAndServe(
      fmt.Sprintf("%s:%s", config.Config.Server.Host, config.Config.Server.Port),
      initRoutes()))
}
```

Hopefully this post gave you a better idea of how you can use configuration files and environment variables to streamline your application development and deployment. You can view the entire source code on [github](https://gist.github.com/ibraheemdev/dfb0801bd5190fdef46e7fe89bc8b4cd)