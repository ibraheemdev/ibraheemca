---
template: writing.html
title: Most Common N Page Path
slug: most-common-n-page-path
draft: false
date: 2020-08-14T20:57:17.926Z
description: You are given a file named 'paths.txt'. Each line in the file
  represents a user's browsing history in a web session. The task is to find the
  most common N page path in 'paths.txt'.

taxonomies:
    tags:
        - Ruby
        - Puzzle

extra:
    socialImage: /ruby-logo.jpeg
---
I recently came across the following interview question:

You are given a file named 'paths.txt'. Each line in the file represents a user's browsing history in a web session. For example:

```
p1,p2,p1,p4 
=> A user visits page 1, then page 2, 
then back to page 1, and then page 4
```

The task is to find the most common 4-page path in 'paths.txt'. A 'path' is defined as a sequence of sequentially visited pages.

Here is an example. Given a file with the following contents:

```
p1,p2,p3,p2,p3,p2
p2,p3,p2,p3
p7,p4,p2,p3,p2,p3
p2,p3,p2,p3
p4,p8
```

The most common 4-page path is `p2,p3,p2,p3` with 4 occurrences:

```
p1, > p2,p3,p2,p3 < ,p2
> p2,p3,p2,p3 <
p7,p4, > p2,p3,p2,p3 <
> p2,p3,p2,p3 <
p4,p8
```


As you can see, partial paths are allowed.

Before you read the solution, I encourage you to try it out for yourself in any language you wish.

Done? Ok, let's start the solution. I will be using ruby for this post, but the code is pretty basic and can easily be translated. The idea is to create a top level hash counter who's key is a page path and the value is the number of occurrences.

```ruby
counter = {
  "p2,p3,p2,p2": 7,
  "p6,p4,p1,p8": 5,
  ...
}
```

We can define this using `Hash.new(0)`. We are using the literal hash constructor instead of `{}` because `Hash.new(0)` sets default value for any key to `0`, while `{}` sets it to `nil`. This way we won't get undefined method errors when adding to a newly defined hash key.

We can then open the file, and loop through each line:

```ruby
counter = Hash.new(0)
IO.foreach("paths2.txt") do |line|
  ...
end
```

For each line, we can chomp any trailing whitespace, and create an array of each page. We can also skip to the next iteration of the loop in the length of the array is less than 4:

```ruby
...
IO.foreach("paths.txt") do |line|
  pages = line.chomp.split(",")
  # => ['p1', 'p2', 'p4', 'p6', 'p7']
  next if pages.length < 4
end
```

Now we have to shift through every 4 elements of the array. It turns out that ruby has a very handy method for this in the enumerator class, called `each_cons`. It does exactly what we want:

```ruby
$ array = [1, 2, 3, 4]
$ array.each_cons(2).to_a
=> [[1, 2],[2, 3],[3, 4]]
```

If you don't want to use a helper method, then implementing it yourself is really simple:

```ruby
def each_cons(cons, arr)
  temp = []
  0.upto(arr.size - cons) {|i| temp.push(arr[i, cons]) }
  temp
end

$ each_cons(2, [1, 2, 3, 4])
=> [[1, 2],[2, 3],[3, 4]]
```

Regardless of which way you choose, we can then loop over every returned nested array, join it with a comma, and add one to the hash value. This is where the literal hash constructor helps us. We don't have to check if the hash exists, because one will automatically be created with a value of 0 if it doesn't:

```ruby
IO.foreach("paths2.txt") do |line|
  ...
  seqs = pages.each_cons(path_size)
  seqs.each do |s| 
    counter[s.join(",")] += 1
  end
end
```

We can print the most common path using `Hash.values.max()`. Since we are looping through every key in the counter, ties (multiple most visited paths with the same value in the counter) are accommodated. Here is the final code:

```ruby
puts "Finding the most common 4-page path..."

counter = Hash.new(0)
IO.foreach("paths.txt") do |line|
  pages = line.chomp.split(",")
  next if pages.length < 4
  seqs = pages.each_cons(4)
  # or seqs = []; 0.upto(pages.size - 4) {|i| seqs.push(pages[i, 4]) }
  seqs.each do |s| 
    counter[s.join(",")] += 1
  end
end

counter.each do |k, v|
  if v == counter.values.max
    puts "#{k} has the most occurrences, with #{v} total"
  end
end
```

All code is available on [github](https://gist.github.com/ibraheemdev/60e8b7b00f0cfaab5b9efb0246736f7c)

## Bonus Questions

- What is the most common N page path? (ex: what is the most common 5 page path? The most common 2 page path?)
- What are the Y most common N page paths? (ex: what are the top 4 most common 7-page paths)
