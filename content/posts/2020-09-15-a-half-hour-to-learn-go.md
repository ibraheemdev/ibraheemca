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

#### **Packages**

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

#### **Constants**

Unchanging values can be declared with the `const` keyword. Constants can be character, string, boolean, or numeric values:

```go
const Pi = 3.14
```

#### **The Blank Identifier**

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

#### **Arrays**

In Go, arrays have a fixed length:

```go
var a [2]string // an array of 10 integers
a[0] = "Hello"
a[1] = "World"
println(a) // => ["Hello", "World"]
```

You can fill an array with values with an *array literal*:

```go
helloWorld := [2]string{"Hello", "World"}
```

#### **Slices**

Slices don't store any data. They just reference an underlying array. You can create one by slicing an existing array:

```go
nums := [6]int{1, 2, 3, 4, 5, 6}
s := nums[1:4]

fmt.Println(s)
// => [2 3 4]
```

These expressions are equivalent:

```go
var a [10]int

a[0:10]
a[:10]
a[0:]
a[:]
```

If you don't know the length of your array, you can use a slice literal. It will create the array, and then build the slice that references it:

```go
nums := []int{1, 2, 3, 4, 5}
```

Modifying the slice will modify the underlying array:

```go
nums := [6]int{1, 2, 3, 4, 5, 6}

s := nums[0:4]
s[0] = 999

fmt.Println(nums)
// => [999 2 3 4 5 6]
```

To add something to a slice, you can use the append function. It will handle creating a new underlying array if the original array is too small:

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

We can use the blank identifier from before to omit the index, or the value:

```go
for _, name := range names

// these are the same
for index, _ := range names
for index := range names
```

#### **Maps**

Maps are like hashes in ruby, or dictionaries in python:

```go
var m map[string]string
m["key"] = "value"

x = m["key"] // => "value"
```

You can also create them with a map literal:

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

The `defer` statement defers the execution of a function until the surrounding function returns:

```go
defer fmt.Print("world")
fmt.Print("hello ")

// => "hello world"
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

If your `if - else` statements is getting long, switch to a `switch` statement!

```go
switch {
case something:
  doSomething()
case somethingElse:
  doSomethingElse()
default:
  return
}
```

You can also switch on a condition expression:

```go
switch x := 2; x {
case 1:
  doSomething()
case 2:
  // this will be executed
  doSomethingElse()
default:
  return
}
```

In a switch statement, only the first matched case is executed.

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
println(*p) // read i through the pointer
// "i" is 42 

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

Struct fields can also be accessed through a struct pointer:

```go
s := MyStruct{}
p := &s
// this is a shortcut for (*p).X
p.x = 19
println(s.x) // => 19
```

You can create new structs using *struct literals*:

```go
s1 := MyStruct{ x: 1, y: 2 }
s2 := &MyStruct{ x: 1, y: 2 } // here, s2 is a pointer to MyStruct

// the order does not matter, only the names do
```

For smaller structs, you can omit the names of the fields

```go
s1 := MyStruct{ 1, 2 }
// here, the order **does** matter
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
minusTwo := Number{ odd: false, value: -2 }
printf("positive? %t", minusTwo.isStrictlyPositive())
// this prints "positive? false"
```

Struct methods receivers are copied by default, meaning their field's will not be mutated:

```go
func (n Number) makeOdd() {
  // n is a copy of the original number struct
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
  // n is a pointer to the original number struct
  n.odd = true
}

n := Number{}
n.makeOdd()

println(n.odd)
// => true
```

Pointer receivers are used when you want to modify the value the receiver points to. They can also be used to avoid copying the value for each method call, which can be more efficient for large structs.

#### **Interfaces**

Interfaces are something multiple types have in common:

```go
type Signed interface {
  isStrictlyNegative() bool
}
```

Functions can take interface arguments, and can call any method in it's method set:

```go
func IsActuallyNegative(n Negativable) bool {
  return n.isStrictlyNegative()
}
```

A struct *implements* an interface if it implements all of its methods:

```go
func (n *Number) IsActuallyNegative() bool {
  n.value < 0
}
```

Now `*Number` implements the Signed interface.

So this works:

```go
// *Number has the isStrictlyNegative method
// therefore, Number implements the Signed interface
IsActuallyNegative(&Number{})
```

But `Number` doesn't implement `Signed` because `isStrictlyNegative` is defined only on `*Number`, so this doesn't work:

```go
// Number doesn't implement Signed
// because isStrictlyNegative is defined only on *Number
IsActuallyNegative(Number{})
```

And neither does this:

```go
// here, 7 does not implement the Signed interface
IsActuallyNegative(7)
```

#### **Type Assertions**

The interface type that specifies zero methods is known as the empty interface:

```go
interface{}
```

An empty interface may hold values of any type. (Every type implements at least zero methods.):

```go
var x interface{} = Number{} // literally anything
```

But since the empty interface does not have any methods, we cannot call the Number methods on Number.

```go
var x interface{} = Number{} // literally anything

// this fails as the compiler does not know the underlying type of x
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
func do(i interface{}) {
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
}
```

#### **Error Handling**

Functions that can fail typically return an `error`, along with their regular return value:

```go
file, err := os.Open("foo.txt")
```

In Go, errors are values, so this is a very common practice:

```go
func DoStuff() err {
  file, err := os.Open("foo.txt")
  if err != nil { 
    return err
  }
  DoMoreStuff(file)
}
```

You can create errors using the `errors` package:

```go
import "errors"

var err error = errors.New("I am an error")
println(err.Error()) // => "I am an error"
```

If code cannot continue because of a certain error, you can violently stop execution with `panic`:

```go
if err != nil { 
  panic(fmt.Errorf("Could not continue due to error: %w", err))
}

// panic: Could not continue due to error...
// goroutine 1 [running]:
// main.main() /tmp/sandbox091462361/prog.go:5 +0x39
```