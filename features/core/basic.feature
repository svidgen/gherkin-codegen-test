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
		When I create a new `Todo` as `todo` with args
		"""
		{
			"name": "bob"
		}
		"""
		And I save `todo` and return `savedItem`
		Then `savedItem.name` should equal
		"""
		"bob"
		"""

	Scenario: I can retrieve a simple single-value object by ID
		When I create a new `Todo` as `todo` with args
		"""
		{
			"name": "Weird Al"
		}
		"""
		And I save `todo` and return `weird`
		And I query `Todo` with `weird.id` into `results`
		Then `results` should be a single item
		And `results.name` should equal
		"""
		"Weird Al"
		"""

	Scenario: I can retrieve a simple object by property predicate
		When I create a new `Todo` as `todo` with args
		"""
		{
			"name": "Bobby Hill"
		}
		"""
		And I save `todo` and return `bobby`
		And I query `Todo` into `results` with a predicate
		"""
		{
			"name": {
				"eq": "Bobby Hill"
			}
		}
		"""
		Then `results` should be a list of 1
		And the first item of `results` should match `bobby`

	Scenario Outline: I can save a <model> record with name <name>
		When I create a new `<model>` as `original` with args
		"""
		<args>
		"""
		And I save `original` and return `saved`
		And I query `<model>` into `results` with a predicate
		"""
		<predicate>
		"""
		Then `results` should be a list of 1
		And the first item of `results` should match `original`

		Examples:
			| model | args | predicate |
			| Todo | { "name": "George" } | { "name": { "eq": "George" } } |
			| Todo | { "name": "Jeff" } | { "name": { "eq": "Jeff" } } |


