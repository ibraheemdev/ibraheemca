---
template: post
title: Metaprogramming a Custom Ruby Logger
slug: custom-ruby-logger
draft: true
date: 2020-07-14T21:49:52.993Z
description: Metaprogramming a Custom Ruby Logger
category: Ruby
tags:
  - ruby
  - metaprogramming
---
I recently published [mongo beautiful logger](https://github.com/ibraheemdev/mongo_beautiful_logger), a simple gem which defines a custom logger that you can use to beautify your MongoDB logs. Today, I am going to abstract the process I followed while creating the gem into an easy way to create any custom logger.

**Understanding the Ruby Logger Class**

> The [Logger](https://ruby-doc.org/stdlib-2.4.0/libdoc/logger/rdoc/Logger.html) class provides a simple but sophisticated logging utility that you can use to output messages - [Ruby-Doc](https://ruby-doc.org/stdlib-2.4.0/libdoc/logger/rdoc/Logger.html)

Below is an example of creating and using a logger instance:

```ruby
require 'logger'

// Create an instance of the logger class that will output to the console
logger = Logger.new(STDOUT)

// Log messages at different levels
logger.debug("Low-level information for developers.")
logger.info("Information about system operation.")
logger.warn("A warning.")
```

As you can see, any instance of the logger class can log messages to the console or a log file at different levels. These are: `debug, error, fatal, info, warn, and unknown.`

**Creating our Custom Logger**

Now that we understand the Logger class, we can start writing our custom implementation:

```ruby
require 'logger'

class CustomLogger
  def initialize(logger = Logger.new(STDOUT))
    @logger = logger
  end
end
```

The above code block defined a class called `CustomLogger` that takes an optional parameter, logger. The logger parameter defines the logger instance to be used. If no logger is given, it defaults to outputting to the console.

**Defining the Logger Methods.**

If we want our logger to do anything, we have to define the `debug, error, fatal, info, warn, and unknown`methods. To define those methods dynamically, we can use `Module#class_eval.` `Module#class_eval`is used to add methods to a class "on-the-fly".

```ruby
class CustomLogger
  ...
  %w(debug info warn error fatal unknown).each do |level|
    class_eval <<-RUBY
      def #{level}(msg = nil, &block)
        @logger.#{level}(msg, &block)
      end
    RUBY
  end
  ...
end
```

*The `<<-` syntax is telling ruby to define a heredoc. A heredoc is a way to define a multiline string while maintaining whitespace (ie: indentation). It is commonly used to embed snippets of code such as SQL or HTML. Heredoc accepts string interpolation, which is why I chose to use it above.*

In the above code block, we are looping through an array of the logger levels, and defining a class method for each one. Inside each method, we are simple calling the same method on the logger instance. Let's test out our code now:

```ruby
// autoload the file into the irb session
$ irb -r ./custom_logger.rb
$ logger = CustomLogger.new
=> # <CustomLogger:0x000ff2c9...>
$ logger.warn("a test warning message")
W, [2020-07-14T18:40:43.316695 #66813]  WARN -- : a warning message
=> true
```

As you can see, our logger now responds to the `warn` method. This means that our implementation is working. There is a problem with our code, however. If we try to call other common logger methods on our custom logger, we get an error message:

```ruby
$ logger.add(debug, "a debugging message")
NameError (undefined local variable or method `debug' for main:Object)
```

We can solve this issue using `method_missing:`

```ruby
class CustomLogger
  ...
  def method_missing(method, *args, &block)
    @logger.send(method, *args, &block)
  end
  ...
end
```

`method_missing` is called when we call a method that doesn't exist. Here, we can use it to send any other methods to the logger instance, and let the Logger class handle it.