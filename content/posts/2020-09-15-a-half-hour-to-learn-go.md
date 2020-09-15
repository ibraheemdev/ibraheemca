---
template: post
title: A Half Hour to Learn Go
slug: a-half-hour-to-learn-go
socialImage: /media/gopher.jpg
draft: false
date: 2020-09-15T21:55:09.600Z
description: A thorough crash course in Golang.
mainTag: Golang
tags:
  - Golang
---
A lot of thanks goes to [Amos](https://fasterthanli.me/about) for inspiring this article with [A half-hour to learn Rust](https://fasterthanli.me/articles/a-half-hour-to-learn-rust). I thought I'd try it out, but instead of Rust, this article will try to explain Go in half an hour.

Instead of focusing on one or two concepts, I'll try to go through as many Go snippets as I can, and explain what the keywords and symbols they contain mean.

Ready? Go!

#### **Packages**

Every go program is made up of packages,

Programs start by running in package `main`.

You can use external packages by importing them:

```go
package main

import "fmt"
```

You can use exported names in an imported package by using the package name as a qualifier:

```go
import (
  "fmt"
  "math/rand"
)

fmt.Println("My favorite number is", rand.Intn(10))
```

You can create a local alias for any import:
```go
import (
  formatter "fmt"
)

formatter.Println("") // instead of fmt.Intn(10)
```

Or use a dot to access it without any qualifier:
```go
import (
  . "math/rand"
)

Intn(10) // instead of rand.Intn(10)
```

A name is exported if it begins with a capital letter. This is similar to `public` and `private` in other languages:

```go
x := "hello" // x is unexported, or private
A := "hello" // A will be exported, or public
```

Packages can have an `init` function. This will be executed as soon as the package is imported:
```
func init() {
  performSideEffects()
}
```

#### **Scope**

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

A variable defined outside of any function is considered "global". If capitalized, it can be accessed by other packages:
```go
package mypackage

var Global string = "I am a global variable!"
```

#### **Variables**

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
var z []int

println(b) // => false
println(x) // => 0
println(y) // => ""
println(z) // => nil
```

#### **Type Conversions**

You can convert values between different types:

```go
var f float64 = 1 // +1.000000
i := int(f)       // 1
```

Note that this must be done explicitly. Unlike other languages, you cannot pass an `int` as a `float` argument and depend on an implicit conversion by the compiler.

#### **Constants**

Unchanging values can be declared with the `const` keyword. Constants can be character, string, boolean, or numeric values:

```go
const Pi = 3.14
```

You can group the declaration of multiple constants or variables:
```go
const (
  x = 2
  y = 4
)
```

#### **The Blank Identifier**

The blank identifier `_` is an anonymous placeholder. It basically means to throw away something:

```go
// this does *nothing*
_ := 42

// this calls `getThing` but throws away the two return values
_, _ := getThing();
```

You can use it to import a package solely for its `init` function:

```go
import _ "log"
```

Or to avoid compiler errors during development:

```go
var _ = devFunction() // TODO: delete when done
```

#### **Arrays**

In Go, arrays have a fixed length:

```go
var a [2]string // an array of 10 integers
a[0] = "Hello"
a[1] = "World"
println(a) // => ["Hello", "World"]
```

You create arrays using *array literals*:

```go
helloWorld := [2]string{"Hello", "World"}
```

You cannot increase an array beyond its capacity. Doing so will panic:
```go
helloWorld := [2]string{"Hello", "World"}
helloWorld[10] = "Space"

// panic: runtime error: index out of range [10] with length 2
```

To get around this issue, Go provides slices.

#### **Slices**

Slices are more common than arrays. They do not have a fixed length, and are therefore more flexible:
```go
nums := []int{1, 2, 3, 4, 5}
```

Slices can also be created with the built-in function `make`:
```go
make([]string, initialLength)

// initialCapacity can be set for memory optimization
make([]string, initialLength, initialCapacity)
```

You can also create a slice by *slicing* an existing array:
```go
nums := [6]int{1, 2, 3, 4, 5, 6}
s := nums[1:4]

fmt.Println(s)
// => [2 3 4]
```

You can omit the start or end index when slicing an array, so for this array:
```go
var a [10]int
```
These expressions are equivalent:

```go
a[:]
a[0:]
a[:10]
a[0:10]
```

Modifying the elements of a slice will modify its underlying array:
```go
nums := [6]int{1, 2, 3, 4, 5, 6}

s := nums[0:4]
s[0] = 999

fmt.Println(nums)
// => [999 2 3 4 5 6]
```

Slices are just a fancy way to manage an underlying array. You cannot increase a slice beyond its capacity. Doing so will panic, just like with an array:
```go
nums := []int{1, 2, 3, 4, 5, 6}
nums[20] = 9

// panic: runtime error: index out of range [20] with length 6
```

However, Go has built-in functions to make slices feel like arrays, such as the `append` function, which can be used to add items to the end of a slice:
```go
nums := []int{1, 2, 3, 4, 5}
nums = append(nums, 6)

fmt.Println(nums)
// => [1 2 3 4 5 6]
```

You can iterate over slices and arrays with `range`:

```go
names := []string{"john", "joe", "jessica"}
for index, name := range names {
  println(index, name)
}

// 0 john
// 1 joe
// 2 jessica
```

We can use the blank identifier to omit the index or the value from `range`:

```go
for _, name := range names

// these are the same
for index, _ := range names
for index := range names
```

Slices are more complicated than they seem. To understand the inner workings of slices and arrays in detail, check out: [Go Slices: Usage and Internals](https://blog.golang.org/slices-intro)

#### **Maps**

Maps are like hashes in ruby, or dictionaries in python:

```go
var m map[string]string
m["key"] = "value"

x = m["key"] // => "value"
```

You can also create them with a *map literal*:

```go
var m = map[int]string{1: "one", 2: "two"}
```

You can delete map keys:

```go
delete(m, key)
```

Check whether a key is present:

```go
var m map[string]string
m["key"] = "value"

x, ok = m["key"] // => "value", true
x, ok = m["doesnt-exist"] // => nil, false
```

And range over their keys and values:

```go
var m = map[int]string{1: "one", 2: "two"}
for key, value := range names {
  println(key, value)
}

// 1 "one"
// 2 "two"
```

#### **Functions**

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

If a function takes two or more arguments of the same type, you can group them together:
```go
func multiply(x, y int) int {
  return x * y
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

The `defer` statement defers the execution of a function until the surrounding function returns:

```go
defer fmt.Print("world")
fmt.Print("hello ")

// => "hello world"
```

#### **Looping**

Go has only one loop, the `for` loop. It has three components:

* the init statement: executed before the first iteration
* the condition: evaluated before every iteration
* the post statement: executed at the end of every iteration

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

```go
// this loop will also run forever
for {
  println("yup!")
}
```

You can use break to `break` out of a loop:
```go
for {
  if shouldBreak() {
    break
  }
}
```

And `continue` to skip to the next iteration
```go
for i := 0; i < 5; i++ {
  // skip number 2
  if i == 2 {
    continue
  }
  print(i)
}

// => 0 1 3 4
```

#### **Control Flow**

Go's `if` statements have a similar syntax to it's loops:

```go
// this prints "true"
if 1 == 1 {
  println("true")
}
```

`if` conditions can also have an init statement:

```go
// this prints "hello"
if x := "hello"; x != nil {
  println(x)
}
// "x" is now out of scope
```

Go also has `else` and `else if` statements:

```go
if something {
  doSomething()
} else if somethingElse {
  doSomethingElse()
} else {
  return
}
```

If your `if - else` statements is getting long, switch to a `switch` statement :)

```go
switch {
case something:
  doSomething()
case somethingElse > 10:
  doSomethingElse()
default:
  return
}
```

You can also switch on a condition expression:

```go
switch x := 2; x {
// if x equals 1
case 1:
  doSomething()
// if x equals 2
case 2:
  doSomethingElse()
// otherwise
default:
  return
}
```

You can use `fallthrough` to fallthrough to the case below the current case:
```go
switch 1 {
case 1:
    print("1 ")
    fallthrough
case 2:
    print("2 ")
}

// => 1 2
```

In a switch statement, only the first matched case is executed.

Go also has *labels* to help manage control flow:
```go
MyLabel:
```

You can jump to a specific label with the `goto` keyword:
```go
print(1)

// jump to the "Three" label
goto Three
print(2)

Three:
print(3)

// => 1 3
```

Labels have a very specific use case. They can make code less readable, and should be avoided most of the time.

#### **Pointers**

Go has pointers. A pointer holds the memory address of a value.

```go
// "p" is a pointer to an integer
var p *int
```

The `&` operator generates a pointer to its operand:

```go
i := 42
p := &i // point to i
```

The `*` operator denotes the pointer's underlying value:

```go
i := 42
p := &i     // point to i
println(*p) // read i through the pointer => 42
```

You can use `*` to modify the original value:
```go
i := 42
p := &i
*p = 21  // set i through the pointer
// "i" is now 21 
```

#### **Structs**

Structs are declared with the `struct` keyword:

```go
type MyStruct struct {
  x int
  y int
}
```

Struct fields are accessed using a dot:

```go
s := MyStruct{}
s.x = 1
println(s.x)
```

Struct fields can also be accessed and modified through a struct pointer:

```go
s := MyStruct{}
p := &s

(*p).x = 19 // modify s
// "s.x" is now 19
```

Because this is so common, Go allows you to modify the underlying struct of a pointer without explicitly dereferencing:
```go
p := &s

// these are the same
(*p).x = 19
p.x = 19
```

You can create new structs using *struct literals*:

```go
s1 := MyStruct{ x: 1, y: 2 }
s2 := &MyStruct{ x: 1, y: 2 } // s2 is a pointer to MyStruct

// the order does not matter, only the names do
```

For smaller structs, you can omit the names of the fields

```go
// here, the order **does** matter
s1 := MyStruct{ 1, 2 }
```

You can declare methods on your own types:

```go
type Number struct {
  odd bool
  value int
}

func (n Number) isStrictlyPositive() bool {
  n.value > 0
}
```

And use them like usual:

```go
minusTwo := Number{ 
  odd: false, 
  value: -2,
}

minusTwo.isStrictlyPositive()
// => false
```

Struct methods receivers are copied by default, meaning their field's will not be mutated:

```go
func (n Number) makeOdd() {
  // n is a copy of the original Number struct
  // this modifies the copy
  n.odd = true
}

n := Number{}
n.makeOdd()

println(n.odd)
// => false
```

To mutate the original struct, use a pointer receiver:

```go
func (n *Number) makeOdd() {
  // here, n is a pointer to the original number struct
  n.odd = true
}

n := Number{}
n.makeOdd()

println(n.odd)
// => true
```

Pointer receivers are used when you want to modify the value the receiver points to. They can also be used to avoid copying the value for each method call, which can be more efficient for large structs.

#### **Interfaces**

Interfaces are something multiple types have in common. They can contain any number of methods in their method set:

```go
type Signed interface {
  isStrictlyNegative() bool
}
```

Functions can take interface arguments, and can call any method in it's method set:

```go
func SignedIsNegative(s Signed) bool {
  return n.isStrictlyNegative()
}
```

A struct *implements* an interface if it implements all of its methods:

```go
func (n *Number) isStrictlyNegative() bool {
  n.value < 0
}
```

Now `*Number` implements the `Signed` interface.

So this works:

```go
// *Number has the isStrictlyNegative method
// therefore, Number implements the Signed interface
// and can be passed as type `Signed`

SignedIsNegative(&Number{})
```

But `Number` doesn't implement `Signed` because `isStrictlyNegative` is defined only on `*Number`, so this doesn't work:

```go
// `Number` doesn't implement Signed
// because isStrictlyNegative is defined only on `*Number`

SignedIsNegative(Number{})
```

And neither does this:

```go
// here, 7 does not implement the Signed interface
SignedIsNegative(7)
```

#### **Type Assertions**

The interface type that specifies zero methods is known as the empty interface:

```go
interface{}
```

An empty interface may hold values of any type. (Every type implements at least zero methods):

```go
var x interface{} = Number{} // literally anything
```

But since the empty interface does not have any methods, we cannot call the Number methods on Number.

```go
var x interface{} = Number{}

// this fails as the compiler does not know the underlying type of x
// so it does not know whether it has the isStrictlyNegative method
x.isStrictlyNegative()
```

Because we know what x really is, we can use a type assertion:

```go
var x interface{} = Number{}

n = x.(Number)

// now the compiler knows that n is a Number
// so this is fine
n.isStrictlyNegative()
```

If a type assertion fails (x wasn't really a Number), then it will trigger a panic:

```go
var x interface{} = "not a number"
n = x.(Number)

// panic: interface conversion: interface {} is string, not Number
```

To prevent a `panic`, we can use the second return value of a type assertion:

```go
var x interface{} = "not a number"

// this code will not panic
n, ok := x.(Number)

// here, ok is false because the type assertion failed
if !ok { ... }
```

To perform multiple type assertions, we can use a *type switch*:

```go
switch v := i.(type) {
case int:
  fmt.Println("i is an int")
case string:
  fmt.Println("i is an string")
default:
  // %T is a special formatting verb
  // It prints the underlying type of a value
  fmt.Printf("I don't know about this type %T!", v)
}
```

#### **Error Handling**

Functions that can fail typically return an `error`, along with their regular return value:

```go
file, err := os.Open("foo.txt")
```

In Go, errors are values, so you can perform `nil` checks on them. You are going to be seeing **a lot** of this:

```go
file, err := os.Open("foo.txt")
if err != nil { 
  return err
}
DoMoreStuff(file)
```

You can create errors using the `errors` package:

```go
import "errors"

var err error = errors.New("I am an error")
println(err.Error()) // => "I am an error"
```

If code cannot continue because of a certain error, you can stop execution with `panic`:

```go
if err != nil { 
  panic(fmt.Errorf("Could not continue due to error: %w", err))
}

// panic: Could not continue due to error...
// goroutine 1 [running]:
// main.main() /tmp/sandbox091462361/prog.go:5 +0x39
```

You can `defer` a call to `recover`, to regain control of a panicking goroutine. `recover` will return the value passed the panic:
```go
defer func() {
  if r := recover(); r != nil {
    fmt.Println("Recovered from panic: ", r)
  }
}()

fmt.Println("Panicking")
panic("AAAHHH!!!")

// => Panicking
// => Recovered from panic:  AAAHHH!!!
```
#### **Goroutines**

Golang is capable of concurrency through *goroutines*. A goroutine is a lightweight thread. To start a go routine, you simple prefix a function call with the keyword `go`:
```go
go DoSomething()
```

Goroutines are executed `concurrently`. For example, this code will execute in take two seconds to complete:
```go
time.Sleep(time.Second * 1)
time.Sleep(time.Second * 1)

// exec time: 2 seconds
```

But this code only takes one second, because both sleep calls are taking place at the same time!
```go
go time.Sleep(time.Second * 1)
time.Sleep(time.Second * 1)

// exec time: 1 second
```

#### **Channels**

Goroutines communicate through *channels*. You can send values to a channel:
```go
channel <- value
```

And receive values from a channel:
```go
x := <-channel
```

Note that data flows in the direction of the arrow.

Here is an example of a simple multiplication function that communicates through channels:
```go
func multiplyByTwo(num int, result chan<- int) {
  // calculate result
  m := num * 2
  // and send it through the channel
  result <- m
}
```

We can create a channel and send it to our function:
```go
result := make(chan int)
go multiplyByTwo(n, result)
```

The result channel now contains the number calculated by `multiplyByTwo`:
```go
fmt.Println(<-out)
// => 6
```

Channels can be created with a limit, once too many values are sent to the channel, the channel will block:
```go
ch := make(chan int, 1)
ch <- 1
ch <- 2
// fatal error: all goroutines are asleep - deadlock!
```

These are called *buffered channels*.

Channels can be closed:
```go
close(channel)
```

You can test whether a channel has been closed:
```go
v, ok := <-ch
// if "ok" is false, then the channel is closed
```

To receive all the values from a channel until it is closed, you can use `range`:
```go
for value := range channel {
  fmt.Println(value)
}
```

#### **Handling Multiple Channels**

To handle communicating with multiple channels, you can use `select`:
```go
func doubler(c, quit chan int) {
  x := 1
  for {
    select {
      // send x to channel and double it
      case c <- x:
        x += x
      // ... until a value is sent to "quit"
      case <-quit:
        println("quit")
        return
    }
  }
}
```

Let's test the doubler function out:
```go
func main() {
  // make the neccessary channels
  c := make(chan int)
  quit := make(chan int)

  go func() {
    // receive five values from the channel
    for i := 0; i < 5; i++ {
      println(<-c)
    }
    // ... and then quit
    quit <- 0
  }()

  // run doubler
  doubler(c, quit)
}
```

Here is the output:
```go
1
2
4
8
16
quit
```

And with that, we hit 20 minutes estimated reading time. I know the title said 30 minutes, but that's pretty much it! We've covered all 25 keywords of Go's keywords.

Go is a simple yet powerful language. After reading this, you should be able to read most of the Go code you find online.

Thanks for reading!