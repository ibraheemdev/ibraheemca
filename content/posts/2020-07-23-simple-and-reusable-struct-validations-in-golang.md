---
template: post
title: Simple and Reusable Struct Validations in Golang
slug: golang-struct-validations
draft: false
date: 2020-07-23T15:41:14.076Z
description: Creating a Simple and Reusable Struct Validation Package for Golang
mainTag: Golang
tags:
  - Golang
  - Validations
---
**Introduction**

Validations are needed to ensure that the structure of, well, a struct, is in the proper format your application requires. They can be used to check that a user's email is actually an email, or that a writer does not create a blog post without a title. There are many methods of implementing validations in golang. The most common method is to use simple if statements:

```ruby
func (u *User) IsValid() error {
  if u.Email == "" {
    return errors.New("Email cannot be blank")
  }
  if len(u.Name) < 4 {
    return errors.New("Name cannot be less than 4 characters")
  }
}
```

The above code is repetitive, cumbersome, and probably not the best fit for most applications. An alternative method is to use struct tags and reflection. Packages such as [go-playgrounds 'validator'](https://github.com/go-playground/validator) use this method to allow you to write code like this:

```go
type User struct {
    Email string `json:"email" validate:"required,email"`
    Name  string `json:"name" validate:"required,min=4,max=32"`
}

func main() {
  user := &User{}
  err := validate.Struct(user)
}
```

Using a library with struct tags comes with its own pros and cons. The [go-playground validator](https://github.com/go-playground/validator) package for example, is not that easy to customize. For simpler applications that do not want to add an additional dependency, or more complex applications who need flexibility, it is often easier to roll your own.

Probably the best validation framework is ActiveRecord::Validations, a module provided by Ruby on Rails. ActiveRecord allows you to write validation methods on a model, which are automatically run after every database transaction:

```ruby
class User < ApplicationRecord
  validates_presence_of :name
  validates_uniqueness_of :email
end
```

Let's see how we can implement something similar in Golang.

**The Validator Package**

We can start by creating a simple struct called Validator. This struct will have one field; a slice of errors. That way we can return all the errors to the user at once:

```go
package validator

// Validator : struct field validations
type Validator struct {
	Errors []error
}
```

Now, we can create a Validate method that receives a pointer to a Validator:

```go
package validator

import "fmt"

...

// Validate :
func (v *Validator) Validate(cond bool, msg string, args ...interface{}) {
	if cond {
		v.Errors = append(v.Errors, fmt.Errorf(msg, args...))
	}
}
```

The Validate method takes a condition, an error message, and an arbitrary number of arguments. The optional args are of type `interface{}`, an empty interface, so that it can accept generic types. If the condition evaluates to true, Validate will return a formatted error message by expanding the args and passing them to `fmt.Errorf.`

We can use the Validate method to pre-build commonly used validations. These methods will take the name of the field (for error messages), it's value, as well as other parameters required for each validation:

```go
// ValidatePresenceOf : validates presence of struct string field
func (v *Validator) ValidatePresenceOf(fieldName string, fieldValue string) {
	cond := len(strings.TrimSpace(fieldValue)) == 0
	v.Validate(cond, "%s cannot be blank", fieldName)
}

// ValidateMaxLengthOf : validates maximum character length of struct string field
func (v *Validator) ValidateMaxLengthOf(fieldName string, fieldValue string, max int) {
	cond := len(fieldValue) > max
	v.Validate(cond, "%s cannot be greater than %d characters", fieldName, max)
}

// ValidateMinLengthOf : validates minimum character length of struct string field
func (v *Validator) ValidateMinLengthOf(fieldName string, fieldValue string, min int) {
	cond := len(fieldValue) < min
	v.Validate(cond, "%s must be at least %d characters", fieldName, min)
}
```

**Validating User Input**

Now that we finished the validator package, we can use it in http handlers to validate user input. We can create a validate method on our model/database struct:

```go
package users

import (
  ...
  "github.com/username/appname/validator"
  ...
)
type User struct {
    Email string `json:"email"`
    Name  string `json:"name"`
}

func validate(u *User) []error {
	v := &validator.Validator{}
	v.ValidatePresenceOf("Email", u.Email)
    v.ValidatePresenceOf("Name", u.Name)
    v.ValidateMaxLengthOf("Email", u.Email, 32)
    v.ValidateMinLengthOf("Email", u.Email, 4)
	return v.Errors
}
```

We can also add a custom email regex validation using our Validate method:

```go
func validate(u *User) []error {
  ...
  emailRegex := "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
  match, _ := regexp.MatchString(emailRegex, u.Email)
  v.Validate(match, "Email is not in valid format")
  ...
}
```

Now, in our handler, we simply have to call the validate method whenever we decode user input. If the slice of errors returned by the call to validate is not nil, we can convert the errors to an array of strings, and encode them to the http response writer, sending them back to the client as json.

```go
// POST "/users"
func Create(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  	user := new(User)
    json.NewDecoder(r.Body).Decode(&user)
    errs := validate(user)
    if errs != nil {
      	strErrors := make([]string, len(errs))
		for i, err := range errs {
			strErrors[i] = err.Error()
		}
        json.NewEncoder(w).Encode(strErrors)
    }
}
```