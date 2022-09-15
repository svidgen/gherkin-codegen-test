Feature: Related model nested predicates
	Defines and demonstrates how nested predicates on related models should work.

	Background:
		Given a configured Amplify context
		And a clean client database

	Scenario: I can query() <child>.(parent as <parent>).content conditions
		When I delete all existing `<parent>`
		And I delete all existing `<child>`
		When I create a new `<parent>` as `parent` with randomized <parentfields> and `content` set to "predictable content"
		And I save `parent` and return `savedParent`
		And I create a new `<child>` as `child` with randomized <childfields> and `parent` set to `parent`
		And I save `child` and return `savedChild`
		And I query `<child>` into `results` with a predicate
		"""
		{
			"parent.content": {
				"eq": "predictable content"
			}
		}
		"""
		Then the first item of `results` should match `child`

		Examples:
			| parent | parentfields | child | childfields |
			| DefaultPKParent | [id, content] | DefaultPKChild | [id, content] |
			| CompositePKParent | [customId, content] | CompositePKChild | [childId, content] |
			| CompositePKParent | [customId, content] | ImplicitChild | [childId, content] |
			| CompositePKParent | [customId, content] | StrangeExplicitChild | [strangeId, content] |
