# Obey.JS
This is a work in progress and not yet ready for primetime.

# Filtering Tests to Run

## Include vs Exclude
You can specify which tests to run using the `include` and/or `exclude` URL query parameter.  Each parameter accepts a selector string.  If a given test matches both the `include` and `exclude` selector, the `exclude` wins and the test will not be run.

## Selectors

### tags (`@foo`)
To select a test with a given tag, reference the tag inside the selector via `@tag-name`.  For example, to only run scenarios with the `@foo` tag, use the query parameter: `?include=@foo`.

### names (`[bar]`)
Name selectors are wrapped in square brackets `[ ]`.  Name selectors are case insensitive and only check to see if the test name contains the string referenced by the selector.  For example, to exclude all scenarios whose name contains "will throw" (such as a scenario named "This will throw an error"), use the query parameter: `?exclude=[will throw]`.

## Features vs Scenarios

The tag and name selectors can be applied to scenarios and/or features.  To select features with the tag `@foo`, use the selector `feature@foo`.  And to select scenarios with the `@foo` tag, use `scenario@foo`.  If the selector omits both `feature` and `scenario`, then the selector will be applied to scenarios by default.  For example, the following two selectors are equivalent: `@foo` and `scenario@foo`.

Your selectors can reference both features and scenarios.  Just separate the two with a `+` character.  For example, to select features whose name contains "foo", AND within those matched features, select any scenarios with the `@bar` tag, use: `feature[foo]+scenario@bar`.

## Complex Selectors
Your selectors can become as complex as they need to be.  For example `feature[foo]@bar@baz+scenario@hello[world]` will select all features whose name contains "foo" and that are tagged with both `@bar` and `@baz`, and within those matched features, select all scenarios tagged with `@hello` and whose name contains "world".

You can include multiple selectors by delimiting them with a comma (`,`).  The example below contains 3 selectors.

`?include=feature[foo],scenario@bar,[baz]`

This example will include:
1. Any features with the name "foo"
2. Any scenarios tagged with `@bar`
3. Any scenarios whose name contains "baz"

## Examples
`[foo]`, or
`scenario[foo]`
All scenarios whose name includes "foo"

`@bar`, or
`scenario@bar`
All scenarios with the `@bar` tag

`feature[foo]`
All features whose name includes "foo"

`feature@bar`
All features with the `@bar` tag

`feature@foo+scenario@bar`
All features with the `@foo` tag, AND within those feature, only select scenarios with the `@bar` tag

`feature[foo]+scenario[bar]`, or
`scenario[bar]+feature[foo]`
Select all features whose name include "foo" AND within those features, only select scenarios whose name include "bar"