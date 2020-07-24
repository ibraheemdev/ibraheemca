---
template: post
title: Spicing up your Ruby Logger
slug: custom-ruby-logger
draft: false
date: 2020-07-23T23:45:54.829Z
description: Spicing up your ruby logger by metaprogramming a custom ruby logger class
category: Ruby
tags:
  - Ruby
  - Metaprogramming
---
*I recently published [mongo beautiful logger](https://github.com/ibraheemdev/mongo_beautiful_logger), a simple gem which defines a custom logger that you can use to beautify MongoDB logs. If you want to see a working custom logger, you can check out the source code.*

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

**Defining the Logger Methods**

If we want our logger to do anything, we have to define the `debug, error, fatal, info, warn, and unknown`methods. To define those methods dynamically, we can use `Module#class_eval,`a method which allows us to add methods to a class "on-the-fly".

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

As you can see, our logger now responds to the `warn` method. This means that our implementation is working. However, there is a problem with our code that we haven't noticed yet. If we try to call other common logger methods, we get an error message:

```ruby
$ logger.add(debug, "a debugging message")
NameError (undefined local variable or method `debug' for main:Object)
```

We can solve this issue using `method_missing.` `method_missing` is run whenever we call a method that doesn't exist on our class. Here, we can use it to send any other missing methods back to the original logger instance, and let the Logger class handle it.

```ruby
class CustomLogger
  ...
  def method_missing(method, *args, &block)
    @logger.send(method, *args, &block)
  end
  ...
end
```

**Having some fun**

Now that we have our custom logger class all set up, we can start doing some cool things with it. To start, you probably don't want the long default format clogging up your terminal. We can change that by using the formatter method:

```ruby
def initialize(logger = Logger.new(STDOUT))
  @logger = format_logger(logger)
end

private

def format_logger(logger)
  logger.formatter = proc { |severity, datetime, progname, msg| "#{msg}" }
  logger
end
...
```

Our logger will now simply print the log message, without the severity, date, or progname. Our logs are looking a little boring, let's try adding some color to help us find exactly what we need quickly. Colors can be added in the terminal using predefined ANSI escape sequences. We can create a Colors module that includes all the necessary color sequences:

```ruby
module Colors
  WHITE     = "\e[37m"
  CYAN      = "\e[36m"
  MAGENTA   = "\e[35m"
  BLUE      = "\e[34m"
  YELLOW    = "\e[33m"
  GREEN     = "\e[32m"
  RED       = "\e[31m"
  BLACK     = "\e[30m"
  BOLD      = "\e[1m"
  CLEAR     = "\e[0m"
end
```

Now we can create ruby hashes containing a 'match' and a 'color'. If a log message contains a match, we can append the defined color sequence. For example, a mongodb logger might contain matches for find, update, and insert actions:

```ruby
  FIND         = { match: "\"find\"=>",   color: BLUE }
  UPDATE       = { match: "\"update\"=>", color: YELLOW }
  INSERT       = { match: "\"insert\"=>", color: GREEN }
  ACTIONS      = [ FIND, UPDATE, INSERT ]
```

We can define a color method, that accepts a string, a color, and an optional boolean for bold logs. *This method was copied from the [active record log subscriber](https://github.com/rails/rails/blob/master/activesupport/lib/active_support/log_subscriber.rb#L130):*

```ruby
def color(text, color, bold = false)
  bold = bold ? BOLD : ""
  "#{bold}#{color}#{text}#{CLEAR}"
end
```

Now in our class_eval, we can simply loop through the ACTIONS array, check for a match, and color each log message accordingly:

```ruby
%w(debug info warn error fatal unknown).each do |level|
  class_eval <<-RUBY
    def #{level}(msg = nil, &block)
    ACTIONS.each do |a| 
      msg = color(msg, a[:color]) if msg.downcase.include?(a[:match]) }
    end
    @logger.#{level}(msg, &block)
    end
  RUBY
end
```

All done! Let's try it out:

![](/media/beautiful_logs.gif)