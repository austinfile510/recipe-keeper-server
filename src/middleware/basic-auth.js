const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
	const authToken = req.get('Authorization') || '';

	let basicToken;
	if (!authToken.toLowerCase().startsWith('basic ')) {
		return res.status(401).json({ error: 'Missing basic token' });
	} else {
		basicToken = authToken.slice('basic '.length, authToken.length);
	}

	const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(
		basicToken
	);

	if (!tokenUserName || !tokenPassword) {
		console.log('general grievous');
		return res.status(401).json({ error: 'Unauthorized request' });
	}

	AuthService.getUserWithUserName(req.app.get('db'), tokenUserName)
		.then((user) => {
			if (!user) {
				console.log('shorter than expected');
				return res.status(401).json({ error: 'Unauthorized request' });
			}

			return AuthService.comparePasswords(tokenPassword, user.password).then(
				(passwordsMatch) => {
					if (!passwordsMatch) {
						console.log('another fine addition to my collection');
						return res.status(401).json({ error: 'Unauthorized request' });
					}

					req.user = user;
					next();
				}
			);
		})
		.catch(next);
}

module.exports = {
	requireAuth,
};
