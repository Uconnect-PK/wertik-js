export default `
	type User {
		name: String
		age: Int
		username: String
		refreshToken: String
		accessToken: String
		isActivated: Boolean
		activationToken: String
		email: String
		password: String
		gender: String
		referer: String
		message: String
		successMessage: String
		successMessageType: String
		errors: [String]
		statusCode: String
		statusCodeNumber: Int
	}
`;