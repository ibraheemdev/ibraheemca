---
template: writing.html
title: Dead Simple Struct Validation in Go
slug: golang-struct-validations
draft: false
date: 2020-07-23T15:41:14.076Z
description: Most go validation packages rely on reflection, which comes with a
  runtime cost. In this post, we will create a simple yet powerful struct
  validation package for Golang without any reflection!

taxonomies:
    tags:
        - Golang
        - Validations

extra:
    socialImage: /gopher.jpg
---
Validations are needed to ensure that data structures are in the format your application requires. They can be used to check that a user's email is actually an email, or that a writer does not create a blog post without a title. There are many methods of implementing validations in Go. The most common method is to use simple `if` statements:

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

The above code is repetitive, cumbersome, and probably not the best fit for most applications. An alternative method is to use struct tags and reflection. Packages such as [go-playgrounds 'validator'](https://github.com/go-playground/validator) provide reflection based apis that allow you to write code like this:

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

Using a library with struct tags comes with its own pros and cons. The [go-playground validator](https://github.com/go-playground/validator) package, for example, is not that easy to customize. For simpler applications that do not want to add an additional dependency, or more complex applications who need flexibility, it is often easier to roll your own.

The best validation framework I have come across is `ActiveRecord::Validations`, a module provided by Ruby on Rails. It allows you to write validation methods on a model, which are then run automatically after every database transaction:

```ruby
class User < ApplicationRecord
  validates_presence_of :name
  validates_uniqueness_of :email
end
```

Let's see how we can implement something similar in Go.

## The Validator Package

We can start by creating a simple struct called `Validator`. This struct will have one field: a slice of errors. That way we can return all the errors to the user at once:

```go
package validator

// Validator : struct field validations
type Validator struct {
    Errors []error
}
```

Now, we can define `Validator.Validate()`:

```go
package validator

func (v *Validator) Validate(cond bool, msg string, args ...interface{}) {
    if !cond {
        v.Errors = append(v.Errors, fmt.Errorf(msg, args...))
    }
}
```

The Validate method takes a condition, an error message, and an arbitrary number of arguments that will be used to format the error message. If the condition is not true (ie: the resource is not valid), an error message will be appended to the Validator's `Errors`.

Because the Validate method is so generic, we can use it as a building block for other common validations. These methods will take the name of the field (for error messages), it's value, as well as other parameters required for each validation:

```go
// ValidatePresenceOf : validates presence of struct string field
func (v *Validator) ValidatePresenceOf(fieldName string, fieldValue string) {
    cond := len(strings.TrimSpace(fieldValue)) > 0
    v.Validate(cond, "%s cannot be blank", fieldName)
}

// ValidateMaxLengthOf : validates maximum character length of struct string field
func (v *Validator) ValidateMaxLengthOf(fieldName string, fieldValue string, max int) {
    cond := len(fieldValue) < max
    v.Validate(cond, "%s cannot be greater than %d characters", fieldName, max)
}

// ValidateMinLengthOf : validates minimum character length of struct string field
func (v *Validator) ValidateMinLengthOf(fieldName string, fieldValue string, min int) {
    cond := len(fieldValue) > min
    v.Validate(cond, "%s must be at least %d characters", fieldName, min)
}
```

## Validating User Input

Now that we finished the validator package, we can use it in http handlers to validate user input. We can create a validate method on a User model:

```go
package users

import "github.com/ibraheemdev/myapp/validator"

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

We can also add a simple email regex validator:

```go
func validate(u *User) []error {
    ...
    match, _ := regexp.MatchString("/^\S+@\S+\.\S+$/", u.Email)
    v.Validate(match, "Email is not in valid format")
}
```

Now, in our handler, we simply have to call `Validate` whenever we decode user input:

```go
// POST "/users"
func Create(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
    user := new(User)
    json.NewDecoder(r.Body).Decode(&user)
    errs := validate(user)
    if errs != nil {
        // the user is invalid
    }
}
```

If the slice of errors returned by the call to validate is not `nil`, then we know that the user provided invalid input. To notify the user that the validation failed, we can define a `Stringify` method. `Stringify` will convert the `Validator` errors into an array of error messages:

```go
package validator

func Stringify(errs []error) []string {
    strErrors := make([]string, len(errs))
    for i, err := range errs {
        strErrors[i] = err.Error()
    }
    return strErrors
}
```

Now we can send back the stringified errors along with a 422 status code back to the client:
```go
// POST "/users"
func Create(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
    user := new(User)
    json.NewDecoder(r.Body).Decode(&user)
    errs := validate(user)
    if errs != nil {
        w.WriteHeader(http.StatusUnprocessableEntity)
        json.NewEncoder(w).Encode(Stringify(errs))
        return
    }
}
```
That's all for struct validations! The final code is available [on github](https://gist.github.com/ibraheemdev/0f583cebf34f06c882085282d3aabf6b).
