Feature: Core Use
	Basic DataStore usage.

	Scenarios and features tagged with `@unstable` are still in the implementation stage,
	and are not considered stable yet. Feel free to use them, but DO NOT expect cross-platform
	support and DO expect occasional regressions!

	Background:
		Given a configured Amplify context
		And a clean client database
		And I import "Customer" from models

	Scenario: I can save a simple single-value object
		When I create a new `Customer` as `todo` with args
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
		When I create a new `Customer` as `todo` with args
		"""
		{
			"name": "Weird Al"
		}
		"""
		And I save `todo` and return `weird`
		And I query `Customer` with `weird.id` into `results`
		Then `results` should be a single item
		And `results.name` should equal
		"""
		"Weird Al"
		"""

	Scenario: I can retrieve a simple object by property predicate
		When I create a new `Customer` as `todo` with args
		"""
		{
			"name": "Bobby Hill"
		}
		"""
		And I save `todo` and return `bobby`
		And I query `Customer` into `results` with a predicate
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
			| Customer | { "name": "George" } | { "name": { "eq": "George" } } |
			| Customer | { "name": "Jeff" }   | { "name": { "eq": "Jeff" } }   |

			# 	Scenario: I can save a model conditionally with a predicate.
			# 		When I create a new `Customer` as `original` with args
			# 		"""
			# 		{"name": "William"}
			# 		"""
			# 		And I save `original` and return `saved`
			# 		And I copy `Customer` `saved` into `updated` with 
			# 		"""
			# 		{"name": "Bill"}
			# 		"""
			# 		And I save `updated` and return `savedUpdate` with predicate
			# 		"""
			# 		{"name": {"eq": "William"}}
			# 		"""
			# 		Then `savedUpdate` should match `updated`
			# 
			# 	Scenario: I get an error saving a model conditionally with a bad predicate.
			# 		When I create a new `Customer` as `original` with args
			# 		"""
			# 		{"name": "William"}
			# 		"""
			# 		And I save `original` and return `saved`
			# 		And I copy `Customer` `saved` into `updated` with 
			# 		"""
			# 		{"name": "Bill"}
			# 		"""
			# 		Then I expect an error
			# 		When I save `updated` and return `savedUpdate` with predicate
			# 		"""
			# 		{"name": {"eq": "NOT WILLIAM"}}
			# 		"""
			# 		And the error message should match "whatever"
