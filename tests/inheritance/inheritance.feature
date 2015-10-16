Feature: Can inherit from ancestor modules

In order to maintain DRY code
As a developer
I want to be able to inherit methods from ancestor modules

Scenario: Inherit parent world's properties
  Given parent world has properties and methods
    And current module has no world defined
  When I run the current module's features
  Then the current module's steps can access parent world's properties

Scenario: Override parent world's properties
  Given parent world has properties and methods
    And current world has identical properties and methods
  When I run the current module's features
  Then the current module's steps will use own world's properties and methods

Scenario: Modify parent world's methods
  Given parent world has properties and methods
    And current world has methods with same names as parent world methods
  When I run the current module's features
  Then the current module's methods can still access parent world methods

Scenario: Modify parent world's constructor
  Given a parent module with a world constructor
    And a current world constructor that calls parent world constructor
  When I run the current module's features
  Then the current module will invoke both world constructors

Scenario: Call parent module's steps
  Given parent module has steps
    And current module is missing some steps
  When I run the current module's features
  Then the current module can call the parent module's steps

Scenario: Override parent module's steps
  Given parent module has steps
    And current module has same steps
  When I run the current module's features
  Then the current module will call own steps

Scenario: Modify parent module's steps
  Given parent module has steps
    And current module has steps that call parent module steps
  When I run the current module's features
  Then the current module can call parent module steps

Scenario: Call parent module's hooks
  Given parent module has hooks
  And current module has no hooks
  When I run the current module's features
  Then the parent module hooks will be run

Scenario: Override parent module's hooks
  Given parent module has before and after hooks
  And current module also has before and after hooks
  When I run the current module's features
  Then only the current module's before and after hooks will be called

Scenario: Modify parent module's hooks
  Given parent module has before and after hooks
  And current module has before and after hooks that call parent hooks
  When I run the current module's features
  Then the current module will call both sets of hooks