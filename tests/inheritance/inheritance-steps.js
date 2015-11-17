var childFeature = `
  Feature: Foo

  In order to A
  As a B
  I want to C

  @foo
  Scenario: apple
    Given A
    When B
    Then C
`;

var parentJs = function() {

  this.World = function() {
    this.foo = 'bar';
    this.hello = function(name) { return 'hello ' + name; };
  };

};

var childNoWorld = function(assert) {
  this.Given('A', function() {});
  this.When('B', function() {});
  this.Then('C', function() {
    assert.equal(this.foo, 'bar');
    assert(this.hello('world') === 'hello world');
  });
};

var simpleChild = function(assert) {
  this.Given('A', function() {});
  this.When('B', function() {});
  this.Then('C', function() {
    assert(true);
  });
};

var childSimilarWorld = function(assert) {
  this.World = function() {
    this.foo = 'baz';
    this.hello = function(name) { return 'hi ' + name; };
  };

  this.Given('A', function() {});
  this.When('B', function() {});
  this.Then('C', function() {
    assert.equal(this.foo, 'baz');
    assert(this.hello('world') === 'hi world');
  });
};

var childOverrideWorld = function(assert) {
  this.World = function() {
    this.hello = function(name) {
      return this._super.hello(name) + '. hi ' + name;
    };
  };

  this.Given('A', function() {});
  this.When('B', function() {});
  this.Then('C', function() {
    assert(this.hello('world') === 'hello world. hi world');
  });
};

var parentWithSteps = function(assert) {
  this.When('B', function() {
    assert(true);
    assert(true);
  });
};

var childWithMissingSteps = function(assert) {
  this.Given('A', function() {});
  this.Then('C', function() {
    assert(true);
  });
};

var childOverrideSteps = function(assert) {
  this.Given('A', function() {});
  this.When('B', function() {
    assert(true);
  });
  this.Then('C', function() {
    assert(true);
  });
};

export default function(assert) {

  this.World = function() {
    require.clear('app/');
    require.restore();

    require.mock('app/utils/globals/location', {search: ''});
    this.FeatureTree = require('app/models/FeatureTree');
    this.Feature = require('app/models/Feature');

    this.tree = new this.FeatureTree('root');

    this.tree.addToTree('tests/parent/child/child-feature', childFeature);

    this.compareResultToExpected = () => {
      assert(this.result.passed === this.expected.passed);
      assert(this.result.assertions === this.expected.assertions);
    };
  };

  this.Given('parent world has properties and methods', function() {
    this.tree.addToTree('tests/parent/parent-steps', parentJs);
  });

  this.Given('current module has no world defined', function() {
    this.tree.addToTree('tests/parent/child/child-steps', childNoWorld);
    this.expected = {passed: 1, assertions: 2};
  });
  
  this.When('I run the current module\'s features', function(done) {
    this.tree.init();
    this.features = this.tree.getFeatures();
    this.Feature.run(this.features).then( result => {
      this.result = result;
      done();
    });
  });

  this.Then('the current module\'s steps can access parent world\'s properties', function() {
    this.compareResultToExpected();
  });

  this.Given('a parent module with a world constructor', function() {
    this.counter = 0;
    var self = this;
    this.tree.addToTree('tests/parent/world', function() {
      this.World = function() {
        self.counter++;
      };
    });
  });

  this.Given('a current world constructor that calls parent world constructor', function() {
    this.tree.addToTree('tests/parent/child/child-steps', simpleChild);
    var self = this;
    this.tree.addToTree('tests/parent/child/world', function() {
      this.World = function() {
        self.counter++;
      };
    });
  });

  this.Then('the current module will invoke both world constructors', function() {
    assert(this.counter === 2);
  });

  this.Given('current world has identical properties and methods', function() {
    this.tree.addToTree('tests/parent/child/child-steps', childSimilarWorld);
    this.expected = {passed: 1, assertions: 2};
  });

  this.Then('the current module\'s steps will use own world\'s properties and methods', function() {
    this.compareResultToExpected();
  });

  this.Given('current world has methods with same names as parent world methods', function() {
    this.tree.addToTree('tests/parent/child/child-steps', childOverrideWorld);
    this.expected = {passed: 1, assertions: 1};
  });

  this.Then('the current module\'s methods can still access parent world methods', function() {
    this.compareResultToExpected();
  });

  this.Given('parent module has steps', function() {
    this.tree.addToTree('tests/parent/parent-steps', parentWithSteps);
  });

  this.Given('current module is missing some steps', function() {
    this.tree.addToTree('tests/parent/child/child-steps', childWithMissingSteps);
    this.expected = {passed: 1, assertions: 3};
  });

  this.Then('the current module can call the parent module\'s steps', function() {
    this.compareResultToExpected();
  });

  this.Given('current module has same steps', function() {
    this.tree.addToTree('tests/parent/child/child-steps', childOverrideSteps);
    this.expected = {passed: 1, assertions: 2};
  });

  this.Then('the current module will call own steps', function() {
    this.compareResultToExpected();
  });

  this.Given('current module has steps that call parent module steps', function() {
    var childSteps = function(assert) {
      this.Given('A', function() {});
      this.When('B', function(_super) {
        _super();
        assert(true);
      });
      this.Then('C', function() {
        assert(true);
      });
    };
    
    this.tree.addToTree('tests/parent/child/child-steps', childSteps);
    
    this.expected = {passed: 1, assertions: 4};
  });

  this.Then('the current module can call parent module steps', function() {
    this.compareResultToExpected();
  });

  this.Given('parent module has hooks', function() {
    this.hookCount = 0;
    var self = this;
    var world = function() {
      this.Before(function() {
        self.hookCount++;
      });

      this.Before('@foo', function() {
        self.hookCount++;
      });

      this.After(function() {
        self.hookCount++;
      });

      this.After('@foo', function() {
        self.hookCount++;
      });
    };

    this.tree.addToTree('tests/parent/world', world);
  });

  this.Given('current module has no hooks', function() {
    this.tree.addToTree('tests/parent/child/child-steps', simpleChild);
  });

  this.Then('the parent module hooks will be run', function() {
    assert(this.hookCount === 4);
  });

  this.Given('parent module has before and after hooks', function() {
    var self = this;
    this.hookCount = 0;
    var world = function() {
      this.Before(function() {
        self.hookCount++;
      });

      this.After(function() {
        self.hookCount++;
      });
    };

    this.tree.addToTree('tests/parent/world', world);
  });

  this.Given('current module also has before and after hooks', function() {
    var self = this;

    this.tree.addToTree('tests/parent/child/child-world', function() {
      this.Before(function() {
        self.hookCount++;
      });

      this.After(function() {
        self.hookCount++;
      });
    });

    this.tree.addToTree('tests/parent/child/child-steps', simpleChild);
  });

  this.Then('only the current module\'s before and after hooks will be called', function() {
    assert(this.hookCount === 2);
  });

  this.Given('current module has before and after hooks that call parent hooks', function() {
    var self = this;

    this.tree.addToTree('tests/parent/child/child-world', function() {
      this.Before(function(before) {
        before();
        self.hookCount++;
      });

      this.After(function(after) {
        after();
        self.hookCount++;
      });
    });

    this.tree.addToTree('tests/parent/child/child-steps', simpleChild);
  });

  this.Then('the current module will call both sets of hooks', function() {
    assert(this.hookCount === 4);
  });
}