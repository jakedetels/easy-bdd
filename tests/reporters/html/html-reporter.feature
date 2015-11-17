Feature: Test results displayed in browser

In order to receive quick feedback about test results
As a developer
I want to see test results in the browser

# Scenario: Passing features are minimized
#   Given a feature with all passing scenarios
#   When I initialize Obey
#   Then the feature will be minimized

#   Examples:
#   | state | passed | failed | skipped | missing |
#   | minimized |1|0|0|
#   | maximized |0|1|0|
#   | minimized |0|0|1|
#   | maximized |1|1|0|
#   | maximized |0|1|1|

Scenario: Components rendered with correct visibility
  Given a mix of tests
  When I initialize Obey
  Then <type> components will be <state>
    | type    | state     |
    | passed  | minimized |
    | failed  | maximized |
    | skipped | minimized |
    | missing | maximized |
   And missing scenarios will contain Generate button
   And missing steps will contain missing label

Scenario: Failing features are expanded
Scenario: Features with skipped scenarios are minimized
Scenario: Generate missing steps button is visible
Scenario: Has missing steps

# Scenario: All passing scenarios
#   Then: feature minimized

# Scenario: Has failing
#   Given a
#   When b
#   Then feature maximized
#    And passing scenarios minimized
#    And failing scenarios are maximized
#    And passing steps are minimized
#    And failing steps are maximized

# Scenario: Has missing


# =============
# failing <features|scenarios|steps|examples> are maximized
# missing <features|scenarios|steps> are maximized
# <passing|skipped> <features|scenarios|steps|examples> are minimized
# missing scenarios contains generate missing steps button

# failing and missing components are maximized
# passing and skipped components are minimized

# clicking a minimized component will maximize the component
# clicking a maximized component will minimize the component
# clicking missing steps button will generate the missing steps