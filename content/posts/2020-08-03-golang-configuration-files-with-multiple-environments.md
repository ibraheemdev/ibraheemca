---
template: post
title: Golang Global Configuration Files with Multiple Environments
slug: go-global-config-files
draft: true
date: 2020-08-03T16:57:44.304Z
description: A simple way to decode configuration files based on the current
  application environment into globally accessible variables
mainTag: golang
tags:
  - golang
  - configuration
  - yaml
---
When developing an application, it is common to have configuration data that is used throughout the app. This data can include an http host and port or a database connection url. These configuration variables can change between environments. For example, you might be using a PostgresQL database in production and development, and SQlite in testing. It is considered best practice to put these config variables in a single source of truth, often in environment variables or config files. Doing this makes your app easier to manage and update than hardcoding strings. 

In this post, we will be going over configuration in golang applications through environment based YAML files. We can start by scaffolding out a file structure that looks like this:

```go
    |-- config.go
    |-- environments
        |-- development.yml
        |-- production.yml
        |-- testing.yml
    |-- .env

```

We can fill the environment yaml files with configuration variables. In this example, the config files will simply contain the server host, port, and the buildpath of the static files to be served by a golang router.

```yaml
server:
  host: "localhost"
  port: 5000
  static:
    buildpath: "client/build"

```

The config.go file will contain the logic for decoding and storing the configuration struct. It stores the application's configuration as a global variable. That way, any package that needs access can import the config package, and access the application's configuration variables.

In this example, all of our config files contain the same variables, so we can define a single type, EnvironmentConfig, that contains fields and embedded structs corresponding to the yaml config file.

```go
package config

// Config : application config stored as global variable
var Config *EnvironmentConfig

// EnvironmentConfig :
type EnvironmentConfig struct {
  Server ServerConfig `yaml:"server"`
}

// ServerConfig :
type ServerConfig struct {
  Host   string  `yaml:"host"`
  Port   integer `yaml:"port"`
  Static struct {
    BuildPath string `yaml:"buildpath"`
  } `yaml:"static"`
}
```

We need a way to get the current environment (production, development, testing) of our application. We can store this as an environment variable in our .env file:

```env
APP_ENV=development

```

To read the .env file, we can use the [godotenv](https://github.com/joho/godotenv) package:

```go
package config

import (
  "fmt"
  "os"
  "github.com/joho/godotenv"
)
...

func getEnv() string {
  err := godotenv.Load()
  if err != nil {
    log.Fatal("Error loading .env file")
  }
  return os.Getenv("APP_ENV")
}
```

The config.go file will contain the package's init function. The init function is called when the package is initialized, or when the package is first imported. It will call the readConfig function and assign the returned pointer to the global Config variable:

```go
package config
...

func init() {
  Config = readConfig()
}
```

The readConfig function returns a pointer to an EnvironmentConfig struct:

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

It uses the os package to open the config file corresponding to the current environment. Now we can use the yaml.v3 package to decode the file into an EnvironmentConfig struct and return a pointer:

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

The blank identified is used to import a package solely for its side-effects (initialization), meaning that we are only using the config package for its init function. If you remember, the init function assigns the Config global variable to a pointer of an EnvironmentConfig struct. 

This means that the Config struct is now accessible to your entire application. For example, you can use the http host and port variables in your router's ListenAndServer function:

```go
import (
  "fmt"
  "github.com/yourapp/config"
)
var routerConfig config.ServerConfig = config.Config.Server

// ListenAndServe :
func ListenAndServe() {
  log.Fatal(
    http.ListenAndServe(
      fmt.Sprintf("%s:%s", routerConfig.Host, routerConfig.Port),
      initRoutes()))
}
```
Hopefully this post gave you a better idea of how you can use configuration files and environment variables to streamline your application development and deployment. You can view the entire source code on [github]()