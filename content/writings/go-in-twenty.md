---
template: writing.html
title: Learn Go in Twenty Minutes
slug: go-in-twenty
draft: false
date: 2020-09-16T17:17:28.727Z
description: A thorough twenty minute crash course in Golang.

taxonomies:
    tags:
        - Golang

extra:
    socialImage: /media/gopher.jpg
---
A lot of thanks goes to [fasterthanlime](https://fasterthanli.me/about) for inspiring this article with [A half-hour to learn Rust](https://fasterthanli.me/articles/a-half-hour-to-learn-rust). I thought I'd try something similar, but instead of Rust, this article will try provide an overview of Go in twenty minutes.

Instead of focusing on one or two concepts, or spending half of this article trying to convince you why Go is awesome, I'll try to go through as many Go snippets I can and explain what the keywords and symbols they contain mean. This article can be used as a cheat sheet for developers familiar with Go, or a tutorial for developers new to Go, but familiar with other languages.

Ready? Go!

### Packages

Every Go program is made up of packages,

Programs start by running in package `main`.

You can use external packages by importing them:

```go
package main

import "fmt"
```

You can use exported names in an imported package by using the package name as a *qualifier*:

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
```go
func init() {
  performSideEffects()
}
```

### Scope

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
var Global string = "I am a global variable!"
```

### Variables

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

If you declare a variable without initializing it, it will implicitly be assigned to the zero value of its type:

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

### Type Conversions

You can convert values between different types:

```go
var f float64 = 1 // +1.000000
i := int(f)       // 1
z := uint(f)      // 1
```

Note that unlike in other languages, conversions between types must be done explicitly.

### Constants

Unchanging values can be declared with the `const` keyword. Constants can be characters, strings, booleans, or numeric values:

```go
const pi = 3.14
```

You can group the declaration of multiple constants or variables:
```go
const (
  x = 2
  y = 4
)
```

Constants are *immutable* - they cannot be reassigned to:

```go
const x = 1
x = 2 // error: cannot assign to x
```

### Iota

The `iota` keyword represents successive integer constants:
```go
const (
  zero = iota
  one  = iota
  two  = iota
)

fmt.Println(zero, one, two) // "0 1 2"
```

This can be written in short form:
```go
const (
  zero = iota
  one
  two
)

fmt.Println(zero, one, two) // "0 1 2"
```

You can perform operations on an iota:
```go
const (
  four = iota + 4
  five
  six
)

fmt.Println(four, five, six) // "4 5 6"
```

And use the blank identifier to skip a value:
```go
const (
  zero = iota
  _    // skip 1
  two
  three
)
fmt.Println(zero, two, three) // "0 2 3"
```

Iota's are most commonly used to represent enums, which Go does not support natively.

### The Blank Identifier

The blank identifier `_` is an anonymous placeholder. It basically means to throw away something:

```go
// this does *nothing*
_ := 42

// this calls `getThing` but throws away the 
// two return values
_, _ := getThing();
```

You can use it to import a package solely for its `init` function:

```go
import _ "log"
```

Or to avoid compiler errors during development:

```go
var _ = devFunction() // TODO: remove in production
```

### Looping

Go has only one loop, the `for` loop. It has three components:

* init: executed before the first iteration
* condition: evaluated before every iteration
* post: executed at the end of every iteration

Here's an example:

```go
sum := 0
for i := 0; i < 10; i++ {
  sum ++
}
println(sum) // 10
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
  if i == 2 {
    continue
  }
  print(i)
}

// => 0 1 3 4
```

### Control Flow

Go's `if` statements have a similar syntax to its loops:

```go
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

If your `if - else` statement is getting long, switch to a `switch` statement :)

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

You can also switch on a condition:

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

You can *fall through* to the case below the current case:
```go
x := 1

switch x {
case 1:
    print("1")
    fallthrough
case 2:
    print("2")
}

// => 1 2
```

In a switch statement, only the first matched case is executed unless you *fall through*.

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

Labels have a very specific use case. They can often make code less readable and are avoided by many Go programmers.


### Arrays

Arrays have a fixed length:

```go
var a [2]string // an array of 2 strings
a[0] = "Hello"
a[1] = "World"
println(a) // => ["Hello", "World"]
```

You create arrays using *array literals*:

```go
helloWorld := [2]string{"Hello", "World"}
```

You cannot increase an array beyond its capacity. Doing so will cause a panic:
```go
helloWorld := [2]string{"Hello", "World"}
helloWorld[10] = "Space"

// panic: runtime error: index out of range [10] 
// with length 2
```

To get around this issue, Go provides slices.

### Slices

Slices are more commonly used than arrays. They are more flexible in that they do not have a fixed length:
```go
nums := []int{1, 2, 3, 4, 5}
```

Slices can also be created with the  `make` function:
```go
make([]string, initialLength)

// initialCapacity can be set to avoid allocations
make([]string, initialLength, initialCapacity)
```

You can also create a slice by *slicing* an existing array:
```go
nums := [6]int{1, 2, 3, 4, 5, 6}

// take elements 1 - 4 from `nums`
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

Modifying the elements of a slice will also modify its underlying array:
```go
nums := [6]int{1, 2, 3, 4, 5, 6}

s := nums[0:4]

// modify s
s[0] = 999

// which also modifies nums
fmt.Println(nums)
// => [999 2 3 4 5 6]
```

Slices are just a fancy way to manage an underlying array. You cannot increase a slice beyond its capacity. Doing so will cause a panic, just like with an array:
```go
nums := []int{1, 2, 3, 4, 5, 6}
nums[20] = 9

// panic: runtime error: index out of range [20] 
// with length 6
```

However, Go has built-in functions to make slices feel like arrays. For examples, `append` can be used to add items to a slice:
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

You can use the blank identifier to omit the index, or the value from `range`:

```go
for _, name := range names { ... }
for index, _ := range names { ... }
```

If you only want the index, you can omit the value entirely:

```go
names := []string{"john", "joe", "jessica"}

for index := range names {
    println(index)
}

// => 0 1 2
```

To understand the inner workings of slices and arrays in detail, check out: [Go Slices: Usage and Internals](https://blog.golang.org/slices-intro)

### Maps

Maps are like hashes in ruby or dictionaries in python. You create them with a *map literal*:

```go
mymap := map[int]string{1: "one", 2: "two"}
```

Or the `make` function:

```go
mymap := make(map[int]string)
```

You can set the value under a particular key:

```go
mymap["key"] = "value"
```

And access it:

```go
val := mymap["key"]
println(val) // "value"
```

Or delete it:

```go
delete(mymap, key)
```

You can check whether a key is present:

```go
x, ok = mymap["key"] // => "value", true
x, ok = mymap["doesnt-exist"] // => nil, false
```

And iterate over a map's keys and values:

```go
var m = map[int]string{1: "one", 2: "two"}
for key, value := range names {
  println(key, value)
}

// 1 "one"
// 2 "two"
```

### Functions

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

These are called *variadic functions*. They can be called just like regular functions, except you can pass in as many arguments as you want:

```go
variadic(1, 2, 3) // => [1, 2, 3]
```

If a function takes two or more arguments of the same type, you can group them together:
```go
func multiply(x, y int) int {
  return x * y
}
```

The `defer` statement defers the execution of a function until the surrounding function returns:

```go
defer fmt.Println("world")
fmt.Println("hello")

// "hello"
// "world"
```

Defer is often used with an anonymous function:
```go
defer func() {
  println("I'm done!")
}()
```

### Anonymous Functions*

Go supports anonymous functions. Anonymous functions are useful when you want to define a function inline without having to name it:

```go
one := func() int { 
  return 1 
}

println(one()) // 1
```

Functions can take functions as arguments

```go
func printNumber(getNum func() int) {
  num := getNum()
  println(num)
}

printNumber(func() int { 
  return 1 
})

// => 1
```

A function can also return an anonymous function:
```go
func getOne() func() int {
  return func() int {
    return 1
  }
}

one := getOne()
println(one()) 

// => 1
```

Anonymous functions allow us to dynamically change what a function does at runtime:
```go
doStuff := func() {
  fmt.Println("Doing stuff!")
}
doStuff()

doStuff = func() {
  fmt.Println("Doing other stuff.")
}
doStuff()

// => Doing stuff!
// => Doing other stuff.
```

Anonymous functions can form *closures*. A closure is an anonymous function that references a variable from outside itself:
```go
n := 0
counter := func() int {
  n += 1
  return n
}
println(counter())
println(counter())

// => 1
// => 2
```

Note how `counter` has access to `n`, even though it was never passed as a parameter.

### Pointers

A pointer holds the memory address of a value.

```go
// "p" is a pointer to an integer
var p *int
```

The `&` operator generates a pointer to its operand:

```go
i := 42
var p *int = &i // point to i
```

The `*` operator lets you access the pointer's underlying value:

```go
i := 42
p := &i     // point to i

println(*p) // read i through the pointer 
// => 42
```

You can use `*` to modify the original value:
```go
i := 42

p := &i  // point to i 
*p = 21  // modify i through the pointer

println(i) // 21 
```

### Custom Types and Methods

You can create a custom type with the `type` keyword:
```go
type UserName string
```

This is called a *type definition*. It defines a new, distinct type that is based on the structure of an underlying type. 

You can define *methods* on your custom types. Methods are different than functions in that they take a *reciever* and are called on an instance of a specific type. The reciever is specified *before* the method name, and the arguments are specified *after*:
```go
type MyString string

// A method called `Print` with a reciever of type `MyString`
func (m MyString) Print() {
  println(m)
}

var x MyString = "hello"
x.Print() // => "hello"
```

Methods receivers are copied by default, meaning their fields will not be mutated:

```go
func (m MyString) BecomeHello() {
  // m is a copy of the original MyString type
  // this modifies the copy
  m = "hello"
}

var x MyString = "not hello"
x.BecomeHello()

println(x)
// => "not hello"
```

To mutate the receiver, use a pointer:

```go
func (m *MyString) BecomeHello() {
  *m = "hello"
}

var x MyString = "not hello"
x.BecomeHello()

println(x)
// => "hello"
```

Pointer receivers are used when you want to modify the value the receiver points to. They can also be used to avoid copying the value for each method call, which can be more efficient when dealing with large amounts of data.

### Structs

Structs are a built-in Go type. You can declare one with the `struct` keyword. They can have any number of fields a specified type:

```go
type MyStruct struct {
  a string
  x int
  y int
  z MyOtherStruct
}
```

You can create a new struct with a *struct literals*:

```go
s1 := MyStruct{ x: 1, y: 2 }

// a pointer to a struct
var s2 *MyStruct = &MyStruct{ x: 1, y: 2 } 
```

You can omit the names of the fields and instead rely on the order:

```go
s1 := MyStruct{ 1, 2 }
```

Struct fields are accessed using a dot:

```go
s := MyStruct{}
s.x = 1 
```

If a field is not initialized, it defaults to its type's zero value:
```go
s1 := MyStruct{}
s1.x // => 0
```

Struct fields can also be accessed and modified through a struct pointer just like a regular variable:

```go
s := MyStruct{}

p := &s
(*p).x = 19 // modify `s` through `p`

println(s.x) // => 19
```

Because this is so common, Go allows you to modify the underlying struct of a pointer without a `*`:
```go
p := &s

// these are the same
(*p).x = 19
p.x = 19
```

You can declare methods on your own struct types just like with any other custom type:

```go
type Number struct {
  value int
}

func (n Number) isStrictlyPositive() bool {
  n.value > 0
}
```

And use them as usual:

```go
minusTwo := Number{ 
  value: -2,
}

minusTwo.isStrictlyPositive()
// => false
```

### Interfaces

Interfaces are something multiple types have in common. They can contain any number of methods in their method set:

```go
type Signed interface {
  isStrictlyNegative() bool
}
```

An interface is a type, so it can be used as a function argument, a struct field, or in the place of any other type:

```go
type MyStruct struct {
  signed Signed
}
```

An interface value holds a value of the underlying concrete type. Calling a method on an interface value will call the method on its underlying type:

```go
func SignedIsStrictlyNegative(s Signed) bool {
  // call a method on the underlying type of `s`
  return s.isStrictlyNegative()
}
```

A struct *implements* an interface if it has all of its methods:

```go
func (n *Number) isStrictlyNegative() bool {
  n.value < 0
}
```

Now `*Number` implements the `Signed` interface.

So this works:

```go
SignedIsStrictlyNegative(&Number{})
```
However, `Number` doesn't implement `Signed` because `isStrictlyNegative` is defined only on `*Number`.
This is because `Number` and `*Number` are *different* types:

```go
// this will not compile
SignedIsNegative(Number{})

// but this will
SignedIsNegative(&Number{})
```

This won't compile either:

```go
// strings do not implement the Signed interface
SignedIsNegative("a string")
```

### `interface{}`

The interface type that specifies zero methods is known as the empty interface:

```go
interface{} // literally anything
```

An empty interface may hold values of any type. (Every type implements at least zero methods):

```go
var x interface{} = Number{}
var y interface{} = "hello"
var z interface{} = 1
```

But since the empty interface does not have any methods, we cannot call the Number methods on Number.

```go
var x interface{} = Number{}

x.isStrictlyNegative()
```

Because we know what `x` really is, we can use a type assertion:

```go
var x interface{} = Number{}

n := x.(Number)

// now the compiler knows that n is a Number
// so this is fine
n.isStrictlyNegative()
```

If a type assertion fails (`x` doesn't really implement `Number`), it will trigger a panic:

```go
var x interface{} = "not a number"

n = x.(Number)
// panic: interface conversion: 
// interface {} is string, not Number
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
  fmt.Printf("I don't know about this type %T!", v)
}
```

### Type Aliases

You can create an alias to another type:
```go
type H = map[string]interface{}

// `map[string]interface{}` is very common in Go
// now we can use `H` as a short form
h := H{"one": 1, "two": 1}
```

This is different than a type definition:
```go
// type definition
type H map[string]interface{}

// type alias
type H = map[string]interface{}
```

An alias declaration doesn't create a new type. It just introduces an alias name - an alternate spelling.

### Struct Composition

Structs can be composed of one another through anonymous fields.

For example, here we have a struct called `Animal` that has a `Talk` method:
```go
type Animal struct {
  sound string 
  feet int
}

func (a Animal) Talk() {
  println(a.sound)
}
```

And a struct called `Cat` that embeds an `Animal`. All of `Animal`'s fields are promoted to `Cat`:
```go
type Cat struct {
  Animal
}
```

You can instantiate a new `Cat`, setting the embedded `Animal's` fields:
```go
cat := &Cat{ Animal{ sound: "meow", feet: 4 } }
```

And use any `Animal` methods or fields:
```go
cat.Talk() // => "meow" 
cat.feet   // => 4
```

You can also override an embedded struct's methods:
```go
func (c Cat) Talk() {
  println("meow meow meow")
}

cat.Talk()
// => "meow meow meow"
```

To imitate a call to `super` as found in other languages, you can call the method through the embedded type directly:
```go
cat.Animal.Talk() // prints only one "meow"
```


This behavior is not limited to struct fields. A struct can embed a primitive:
```go
type MyStruct struct {
  string
  int
  bool
}
```

Or any other named type, such as a pointer:
```go
type Cat struct {
  *Animal
}
```

A collection (array, map, or slice):
```go
type Assignments []string

type Homework struct {
  Assignments
}
```

Or an interface:
```go
type MyInterface interface{}

type MyStruct struct {
  MyInterface
}
```

### Interface Composition

Interfaces can also be composed of each other:
```go
type Animal interface{
  Talk()
  Eat()
}

type Cat interface {
  Animal
  SomethingElse()
}
```

Here, Animal's method set is promoted to Cat. This is the equivalent to saying:
```go
type Cat interface {
  Talk()
  Eat()
  SomethingElse()
}
```

### Error Handling

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

Packages often export common error values. You can perform equality checks between errors:
```go
err := makeDatabaseCall()
if errors.Is(err, database.ErrNotFound) {
  return 404
}
```

If code cannot continue because of a certain error, you can stop execution with `panic`:

```go
if err != nil { 
    panic("OMG!!!")
}

// panic: OMG!!!
```

You can call `recover` to regain control of a panic. `recover` will return the value passed to panic:
```go
// if a panic occurs, this function will be called
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
### Goroutines

Go is capable of concurrency through *goroutines*. A goroutine is a lightweight thread. To start a goroutine, you simple prefix a function call with the keyword `go`:
```go
go DoSomething()
```

Goroutines are executed concurrently, not sequentially. For example, this code will take two seconds to complete:
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

Goroutines are often used with anonymous functions:
```go
go func() {
  println("hello")
}()
```

### Channels

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
func multiplyByTwo(num int, result chan <- int) {
  // calculate result
  sum := num * 2
  // and send it through the channel
  result <- sum
}
```

We can create a channel and send it to our function:
```go
result := make(chan int)
go multiplyByTwo(n, result)
```

The result channel now contains the number calculated by `multiplyByTwo`:
```go
fmt.Println(<-result)
// => 6
```

Channels can be created with a limit, once too many values are sent to the channel, the channel will block:
```go
limit := 1
ch := make(chan int, limit)

// this is fine
ch <- 1

// but now the channel is full
ch <- 2

// fatal error: all goroutines are asleep - deadlock!
```

Channels with a limit are called *buffered channels*.

You can also close a channel with the `close` method:
```go
close(channel)
```

You can test whether a channel has been closed:
```go
v, ok := <-ch
// if `ok` is false, then the channel is closed
```

To receive all the values from a channel until it is closed, you can use `range`:
```go
for value := range channel {
  fmt.Println(value)
}
```

### Handling Multiple Channels

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
      case <- quit:
        println("quit")
        return
    }
  }
}
```

Let's test our program out by creating a channel, passing it to `doubler`, and recieving the results: 
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

It works 🎉🎉🎉
```go
1
2
4
8
16
quit
```

And with that, we have hit 20 minutes estimated reading time. After reading this, you should be able to read most of the Go code you find online.

Thanks for reading!
