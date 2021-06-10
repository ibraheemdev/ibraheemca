---
template: writing.html
title: "&mut Doesn't Mean Mutable"
slug: and-mut-doesnt-mean-mutable
draft: true
date: 2021-05-21T19:08:00.906Z
description: 
taxonomies:
    tags:
        - Rust
extra:
    socialImage: /rust-logo.png
---

`&mut` doesn't mean "mutable", nor does `&` mean "immutable". What `&mut` really means is *unique*. `&mut` is a guarantee of unique access. What does that mean in practice?

# 1. Not all mutable references are `&mut`

```rust
let x = Cell::new(1);
cant_mutate(&x);
dbg!(x); // => 9000!?

fn cant_mutate(x: &Cell<usize>) {
    x.set(9000);
}
```

The above program is totally valid Rust. Why? Because `&mut x` isn't the only mutable reference in town. The `Cell` type is not thread safe, and never gives out references to the inner value, so mutating through a *shared* reference is 100% sound.

Newcomers to Rust learn that `&mut x` means that you have a *mutable* reference to `x`. They then learn about `Cell`, `RefCell`, `Mutex`, and atomics. We introduce this concept as *interior mutability*. It can be very confusing to someone who learned that `&mut` means "mutable".

So why do most methods that mutate take `&mut x`. Because having a unique reference means that you can *always* mutate through it safely, even in multi-threaded programs, by virtue of it being unique. In fact, simply *having* two unique references to the same value is undefined behavior due to LLVM optimizations that rustc enables.

Mutating through a shared reference on the other hand is problematic, even in single-threaded code. Take the following program for example:

```rust
let nums = vec![1, 2, 3, 4];

for i in &nums {
    nums.push(i);
}
```

Putting aside the fact that it causes an infite loop, the following program is unsound. Why? Because eventually, the vector will need to re-allocate, invalidating the iterator's reference, and causing undefined behavior.

```rust
fn main() {
    unsafe {
        let nums = &mut vec![1usize, 2, 3, 4] as *mut Vec<usize>;

        for i in &*nums {
            (&mut *nums).push(*i);
            dbg!(&*nums);
        }
    }
}
```
```
[ 1, 2, 3, 4, 1 ]
[ 1, 2, 3, 4, 1, 94281856249872 ]
[ 1, 2, 3, 4, 1, 94281856249872, 3 ]
[ 1, 2, 3, 4, 1, 94281856249872, 3, 4 ]
```

So `&mut` means *unique*, which means that you can always mutate throught it. Mutating through a *shared* reference is totally fine though, as long as you put the necessary safety measures in place to prevent data races.

# 2. `&mut` vs `mut`

On one hand, `let mut` provides "immutability by default". Without it, you change what the binding points to, an idea that is common in many functional programming languages:
```rust
let x = 1;
x = 2; // doesn't work

let mut x = 1;
x = 2; // works just fine
```

`let mut` means that I can make the variable binding point to a different memory location. This change is local to the current scope. `&mut` means that I can change the contents of the memory location:

```rust
let x = &mut 0;
*x = 1;
x = 1; // doesn't work
```

The binding `x` is immutable - it will only point to one memory location. However, because I have a *unique* reference, I can change the contents of the memory location with the deref operator.

The `mut` keyword also affects whether I can take a unique reference to the value:
```rust
let x = 0;
let y = &mut x; // doesn't work
```

So `let mut x` provides immutabilty by default by:

- Affecting whether you can rebind `x`.
- Affecting whether you can take a unique reference to `x`.

If `&mut` meant mutable, this would make sense. However, it doesn't. You can mutate through shared references too:

```rust
let x = Cell::new(1);
x.set(2);
```

The fact is, immutability by default doesn't really fit with Rust. However, people really like it. It's a nice to have, and is very valuable when reasoning about code, but it is important to understand that mutable bindings provide 0 guarantees. The real gurantee is `&mut`'s of unique access.

# 3. `ref mut`

Even more confusing, `ref mut` is a pattern that gives you a unique reference.
```rust
let ref mut x = 1;
*x = 2;
```

So, in conclusion, this doesn't work:

```rust
let x = Some(1);
match x {
    Some(x) => x = 2,
    None => {}
}
```

This does, but the mutating is simple a local shadow, and does not affect the outer `x`:
```rust
let x = Some(1);
match x {
    Some(mut x) => x = 2,
    None => {}
}
```

This doesn't work, because `x` wasn't declared as mutable and therefore you cannot take a unique reference to it:
```rust
let x = Some(1);
match x {
    Some(ref mut x) => *x = 2,
    None => {}
}
```

Finally, this works as expected:
```rust
let mut x = Some(1);
match x {
    Some(ref mut x) => *x = 2,
    None => {}
}

assert_eq!(x, Some(2));
```

As you have probably realized by now, the `mut` keyword means different things in different places. It conflates the guarantee of uniqueness with the functional idea of immutability. If it was impossible to mutate through shared references, this would make total sense. `&mut` really would mean mutable, and not declaring a variable binding as `mut` would truly guarantee that it shall not be mutated. However, as we now know, this is not the case. `&mut x` means unique, `&x` means shared, and `mut x` is weird :(

# 3. `&mut` is useful for other things too

# Conclusion

Obviously, it's too late to change anything, and these discussions have already taken place. The point of this post was not to cause a second mutpocalypse :) Instead, the point was to explain some of the terminology around mutability, interior mutability, uniqueness, and hopefully clarify the concepts to those who might not fully understand them.

~~Rename `&mut` to `&uniq` and remove the `mut` keyword Rust 2027 edition.~~
