Feature: Custom primary key support
	Defines and demonstrates how custom primary key should work.

	Background:
		Given a configured Amplify context
		And a clean client database

	Scenario: I can save a model with a custom PK (<model>)
		When I create a new `<model>` as `original` with randomized <fields>
		And I save `original` and return `savedItem`
		Then `savedItem` <fields> should match `original` <fields>

		Examples:
			| model   | fields                  | pk                 |
			| Todo    | [id, name]              | [id]               |
			| Comment | [commentId, message]    | [commentId, owner] |
			| Post    | [postId, name, content] | [postId, name]     |

