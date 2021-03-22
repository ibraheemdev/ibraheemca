---
template: writing.html
title: Converting an existing Ruby on Rails application to MongoDB
slug: convert-rails-to-mongodb
draft: false
date: 2020-07-06T17:18:23.372Z
description: How to convert an existing Ruby on Rails application from a
  relational database and active record, to MongoDB and Mongoid.

taxonomies:
    tags:
        - Ruby on Rails
        - MongoDB
        - Ruby

extra:
    socialImage: /media/rails-logo.png
---

Recently, while working on [agilely](https://github.com/ibraheemdev/agilely), I realized that MongoDB was a better fit for my database design. I am currently converting the entire application from PostgresQL to MongoDB, and thought I'd share what I learned along the way.

_Note that this post does not cover migrating your data from a RDBMS. If you have a production app with data that needs to migrated, you might want to look at the [pg2mongo](https://github.com/datawrangl3r/pg2mongo) migration framework, or view the [official MongoDB migration guide](https://www.mongodb.com/collateral/rdbms-mongodb-migration-guide)_

**MongoDB Installation**

First, we have to install MongoDB. If you're on a mac, you can do this with Homebrew:

```
$ brew tap mongodb/brew
$ brew install mongodb-community@4.2
```

To view the installation process for all operating systems, refer to the [MongoDB docs](https://docs.mongodb.com/manual/installation/)

**Rails Configuration**

Now that you have MongoDB installed, you have to configure your rails application to use it as your default database.

The officially supported MongoDB ODM for rails is [Mongoid](https://github.com/mongodb/mongoid). Mongoid aims to achieve parity with ActiveRecord, and the Mongoid team has done an excellent job at making the switch as seamless and easy as possible. Mongoid accepts all the ActiveRecord associations, validations, and callbacks you are used to. Getting rails to switch to Mongoid can be tricky, but if you follow all the steps, you should be able to get it to work.

If you go to your `config/application.rb` file, you will most likely see the following:

```ruby
...
require "rails/all"
...
```

This line is telling rails to include all the default frameworks. If you want to use Mongoid however, you need to remove this line and instead explicitly choose all the frameworks you want for your app:

```ruby
...
require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
# require "active_record/railtie"
# require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# uncomment if your app uses the asset pipeline
# require "sprockets/railtie"
# uncomment if your app uses rails test_unit
# require "rails/test_unit/railtie"
...
```

Note that active\_record and active\_storage are not being required. Mongoid will take the place of active\_record, and because active_storage depends on active\_record, it cannot be used with Mongoid.

Now that we are not using active\_record, any references to it in files in the config directory need to be removed. For example:

```ruby
config.active_record.dump_schema_after_migration = false
config.active_storage.service = :local
```

We also need to remove the active\_storage npm package. To remove this, run:

```bash
$ yarn remove @rails/activestorage
```

And remove this line from your application.js webpack entry point file:

```javascript
require("@rails/activestorage").start();
```

You can also delete the /storage directory and your config/storage.yml file

You might be wondering why we haven't deleted the `/db` directory and the config/database.yml file. Deleting these files now can cause errors because until we generate the mongoid.yml, rails will still be looking for a database configuration. Let's setup Mongoid now:

**Mongoid Setup**

First, add the Mongoid gem to your application:

```ruby
gem 'mongoid', '~> 7.0.6' (or the latest current version)
```

And run:

```bash
$ bundle:install
```

Now, you have to stop spring:

```bash
$ spring stop && spring start
```

We can now generate the default mongoid configuration file:

```bash
$ rails g mongoid:config
```

To view all the mongoid configuration options, you can view [the mongoid docs](https://docs.mongodb.com/mongoid/current/tutorials/mongoid-configuration/)

Now that mongoid is setup, you can delete the /db folder, the config/database.yml file, and remove the database gem from your Gemfile ( sqlite3, pg, etc. )

**Updating Rails Models**

Now that you're on Mongoid, you have to update your rails models. A Mongoid User model could look something like this:

```ruby
class User
  include Mongoid::Document
  include Mongoid::Timestamps

  field Email, type: String
  field Name, type: String

  validates :name, presence: true

  has_many :posts
end
```

Note that the User class is no longer inheriting from ApplicationRecord.

**Testing MongoDB**

That's it! Mongoid is all setup. To test your configuration, start the mongodb service:

```bash
brew services start mongodb-community@4.2
```

And test Mongoid in the rails console:

```ruby
~ rails console
~ u = User.create(email: "john@example.org", name: "john")
```

To stop mongodb, you can run:

```bash
brew services start mongodb-community@4.2
```

**Debugging:**

Sometimes Spring tries to load ActiveRecord even when the application has no references to it. If running `spring stop && spring start` doesn't work, try adding an ActiveRecord adapter such as sqlite3 to your Gemfile so that ActiveRecord can be loaded. You could also try to remove Spring from your application:

```ruby
$ pkill -f spring
$ spring stop
```

Edit your Gemfile, removing all references to spring, and reinstall all your gems:

```ruby
$ bundle install --redownload
$ bin/spring binstub –remove –all
```

Alternatively, you can disable spring locally by adding the following environment variable to your `bin/spring` file:

```ruby
#!/usr/bin/env ruby

ENV['DISABLE_SPRING'] = '1'
...
```

For more information about this bug, see [the github issue](https://github.com/rails/spring/issues/601).
