Feature: Related model lazy loading
	Defines and demonstrates how lazy loading of related models should work.

	Background:
		Given a configured Amplify context
		And a clean client database

	Scenario: I can save a parent model (<parent>)
		When I create a new `<parent>` as `parent` with randomized <parentfields>
		And I save `parent` and return `savedParent`
		And I create a new `<child>` as `child` with randomized <childfields> and `parent` set to `parent`
		And I save `child` and return `savedChild`
		Then awaited `savedChild.parent` <parentfields> should match `parent` <parentfields>

		Examples:
			| parent | parentfields | child | childfields |
			| DefaultPKParent | [id, content] | DefaultPKChild | [id, content] |
			| CompositePKParent | [customId, content] | CompositePKChild | [childId, content] |
			| CompositePKParent | [customId, content] | ImplicitChild | [childId, content] |
			| CompositePKParent | [customId, content] | StrangeExplicitChild | [strangeId, content] |
			| CompositePKParent | [customId, content] | ChildSansBelongsTo | [childId, content] |
