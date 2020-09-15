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

Every go program is made up of packages,

Programs start by running in package `main`.

You can use external packages by importing them:
```go
package main

import (
  "fmt"
  "math/rand"
)
```
You can use exported names in an imported package by using the package name as an identifier:
```
import (
  "fmt"
  "math/rand"
)

fmt.Println("My favorite number is", rand.Intn(10))
```

A name is exported if it begins with a capital letter. This is similar to `public` and `private` in other languages:
```go
x := "hello" // x is unexported, or private
A := "hello" // A will be exported, or public
```

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
var x, y int
x, y = 10, 20
```

If you declare a variable without initializing it, it will implicitly be assigned to the zero value of it's type:

```go
var b bool
var x int
var y string

println(b) // => false
println(x) // => 0
println(y) // => ""
```

You can convert values between different types:
```go
var f float64 = 1 // +1.000000
i := int(f)       // 1
```

Unchanging values can be declared with the `const` keyword. Constants can be character, string, boolean, or numeric values:
```go
const Pi = 3.14
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

Functions can return multiple values:

```go
func oneTwoThree() (int, int, int) {
  return 1, 2, 3
}
```

They can also take specified arguments:

```go
func sayHello(name string) {
  fmt.Printf("hello %s", name)
}
```

Or an arbitrary number of arguments:

```go
func variadic(nums ...int) {
  println(nums)
}
```

These are called *Variadic Functions*.

They can be called just like regular functions:

```go
variadic(1, 2, 3) // => [1, 2, 3]
```

Or you can pass in a slice directly:

```go
nums := []int{1, 2, 3}
variadic(nums) // => [1, 2, 3]
```

A pair of brackets declares a block, which has its own scope:

```go
// This prints "in", then "out"
func main() {
  x := "out"
  {
    // this is a different `x`
    x := "in"
    println(x)
  }
  println(x)
}
```

Go has only one loop, the `for` loop. It has three components:
- the init statement: executed before the first iteration
- the condition: evaluated before every iteration
- the post statement: executed at the end of every iteration

Here's an example:
```go
sum := 0
for i := 0; i < 10; i++ {
  sum ++
}
// "sum" is now 10
```

The init and post statements are optional:
```go
// this loop will run forever
yup := true
for yup {
  println("yup!")
}
```

An infinite for loop can also be written like this:
```
// this loop will also run forever
for {
  println("yup!")
}
```