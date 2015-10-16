Feature: Can filter features and scenarios to be run

In order to focus my attention on certain tests
As the user
I want to be able to specify which tests run

Scenario: test
  Given URL parameter <param>
   And two sets of feature files
  When the features are initialized
  Then <feature-count> features will be run
   And <scenario-count> scenarios will be run

  Examples:
    | param                                       | f_count   | s_count   |
    |                                             | 2         | 6         |
    | include=feature                             | 2         | 6         |
    | include=feature+scenario                    | 2         | 6         |
    | include=feature&exclude=scenario            | 2         | 6         |
    | include=@bar                                | 2         | 2         | # tags w/o model type default
    | include=@boo                                | 2         | 0         | # to scenario model type
    | include=feature@boo                         | 1         | 3         |
    | include=feature@boo+scenario@foo            | 1         | 1         |
    | include=feature@boo&exclude=scenario@foo    | 1         | 2         |
    | include=feature@boo&exclude=@foo            | 1         | 2         |
    | include=@bar@homer                          | 2         | 1         |
    | include=[foo]                               | 2         | 0         | # names w/o model type default
    | include=feature[foo]                        | 1         | 3         | # to scenario model type
    | include=feature[foo]+scenario[apple]        | 1         | 1         |
    | include=feature[foo]&exclude=scenario[apple]| 1         | 2         |
    | exclude=[apple]                             | 2         | 5         |
