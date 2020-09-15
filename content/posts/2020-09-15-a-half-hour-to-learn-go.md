---
template: post
title: A half-hour to learn Go
slug: a-half-hour-to-learn-go
socialImage: /media/gopher.jpg
draft: true
date: 2020-09-15T15:56:03.101Z
description: In order to increase fluency in a programming language, one has to
  read a lot of it. But how can you read a lot of it if you don't know what it
  means?
mainTag: Golang
tags:
  - Golang
---
A lot of thanks goes to [Amos](https://fasterthanli.me/about) for inspiring this article with [A half-hour to learn Rust](https://fasterthanli.me/articles/a-half-hour-to-learn-rust). I thought I'd try it out, but instead of Rust, this article will try to explain Go in half an hour.

Instead of focusing on one or two concepts, I'll try to go through as many Go snippets as I can, and explain what the keywords and symbols they contain mean.

Ready? Go!

`var` declares a variable of a given type:
```go
var x int // Declare variable "x" of type int
x = 42    // Assign 42 to "x"
```

This can also be written as a single line:
```go
var x int = 42
```

You can specify a variable's type implicitly:
```go
var x = 42
```

Inside of a function body, this can also be written in short form:
```go
x := 42
```

You can declare many variables at the same time:
```go
var a, b, c int
a, b, c = 1, 2, 3
x, y := 10, 20
```

If you declare a variable without initializing it, it will implicitly be assigned to the zero value of it's type:
```go
var x int
var y string

println(x) // => 0
println(y) // => ""
```

The blank identifier `_` is an anonymous placeholder. It basically means to throw away something:
```go
// this does *nothing*
_ := 42

// this calls `getThing` but throws away the two return values
_, _ := getThing();
```

You can use it to import a package solely for its side effects:
```go
import _ "log"
```

Or to avoid compiler errors during development:
```go
var _ = devFunction() // TODO: delete when done
```

You don't need semi-colons in Go, as they are automatically inserted by the compiler. If you wan't multiple statements on the same line however, you must use semi-colons:
```
if x := 1; x != 0 { ... }
```
(We'll go over if statements later).

Statements can span multiple lines:
```go
x := doSomething(
  withThis(),
  andThis(),
  andThis(),
)
```

`func` declares a function.

Here's a void function:
```go
func greet() {
  println("Hi there!")
}
```
And here's a function that returns an integer:
```go
func fairDiceRoll() int {
  return 4
}
```