Feature: Core Use
	Basic DataStore usage.

	Scenarios and features tagged with `@unstable` are still in the implementation stage,
	and are not considered stable yet. Feel free to use them, but DO NOT expect cross-platform
	support and DO expect occasional regressions!

	Background:
		Given a configured Amplify context
		And a clean client database
		And a new client schema
		"""
		type Todo @model {
			id: ID!
			name: String
		}
		"""
		And I import "Todo" from models

	Scenario: I can save a simple single-value object
		When I create a new "Todo" as "todo" with args
		"""
		{
			"name": "bob"
		}
		"""
		And I save "todo" with return value "saved item"
		Then "saved item" should have "id"
		And "saved item" field "name" should equal
		"""
		"bob"
		"""
