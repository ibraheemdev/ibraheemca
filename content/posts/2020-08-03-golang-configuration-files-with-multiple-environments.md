---
template: post
title: Golang Configuration Files with Multiple Environments
slug: go-env
draft: true
date: 2020-08-03T16:57:44.304Z
description: blabla
mainTag: golang
tags:
  - golang
---
When developing an application, it is common to have configuration data that is used throughout the app. This data can include an http host and port or a database connection url. These configuration variables can change between environments. For example, you might be using a PostgresQL database in production and development, and SQlite in testing. It is considered best practice to put these config variables in a single source of truth, often in environment variables or config files. Doing this makes your app easier to manage and update than hardcoding strings. 

In this post, we will be going over configuration in golang applications through  environment based YAML files. We can start by scaffolding out a file structure that looks like this:

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
  port: "5000"
  static:
    buildpath: "client/build"

```

The config.go file will contain the logic for decoding and storing the configuration struct. It stores the application's configuration as a global variable. That way, any package that needs access can import the config package, and access the Config variable.

In this example, all of our config files contain the same variables, so we can define a single type, EnvironmentConfig, that contains a ServerConfig struct. The ServerConfig struct contains fields corresponding to the yaml file.

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

The config.go file will contain the packages init function. The init function is called when the package is initialized, or when the package is first imported. It will call the readConfig function, and the returned pointer to the global Config variable:

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
}

```

It uses the os package to open the config file corresponding to the current environment by calling the getEnv function, which we have not defined yet. We need a way to get the current environment (production, development, testing) of our application. We can store this as an environment variable in our .env file:

```env
APP_ENV=development

```