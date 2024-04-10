export default `
	type SuccessResponse {
    message: String
  }

	scalar JSON
	scalar JSONObject

	enum order_by {
		ASC
		DESC
	}

	input string_filter_input {
		_eq: String
		_ne: String
		_like: String
		_notLike: String
		_iLike: String
		_notILike: String
		_startsWith: String
		_endsWith: String
		_substring: String
		_regexp: String
		_notRegexp: String
		_iRegexp: String
		_notIRegexp: String
		_or: string_filter_input
		_and: string_filter_input
		_between: [String]
		_notBetween: [String]
	}
	input int_filter_input {
		_eq: Int
		_gt: Int
		_gte: Int
		_lt: Int
		_lte: Int
		_ne: Int
		_between: [Int]
		_notBetween: [Int]
		_in: [Int]
		_notIn: [Int]
		_or: int_filter_input
		_and: int_filter_input
	}
	input date_filter_input {
		_eq: String
		_gt: String
		_gte: String
		_in: [String!]
		_lt: String
		_lte: String
		_neq: String
		_nin: [String!]
	}
	input boolean_filter_input {
		_eq: Boolean
		_ne: Boolean
	}
	type Sorting {
		column: String
		type: String
	}
	input SortingInput {
		column: String
		type: String
	}
	input PaginationInput {
		page: Int
		limit: Int
	}
	input filter_input {
		column: String!
		operator: String!
		value: String!
	}
	type Pagination {
		total: Int
		pages: Int
		page: Int
		nextPage: Int
		previousPage: Int
		hasMore: Boolean
		limit: Int
	}
	type Filter {
		column: String
		operator: String
		value: String
	}
	type PaginationProperties {
		total: Int
		pages: Int
		page: Int
		nextPage: Int
		previousPage: Int
		hasMore: Boolean
		limit: Int
	}
	
`
