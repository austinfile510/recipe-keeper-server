require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, API_ENDPOINT } = require('./config');
const errorHandler = require('./error-handler');
// const authRouter = require('./auth/auth-router');
const usersRouter = require('./users/users-router');
const recipesRouter = require('./recipes/recipes-router');
const myRecipesRouter = require('./my-recipes/my-recipes-router');
const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(
	cors({
		origin: API_ENDPOINT,
	})
);

app.use('/api/recipes', recipesRouter);
app.use('/api/users', usersRouter);
app.use('/api/my-recipes', myRecipesRouter);
// app.use('/api/auth', authRouter);



app.get('/', (req, res) => {
	res.send('Hello, world!');
});

app.use(function errorHandler(error, req, res, next) {
	let response;
	if (NODE_ENV === 'production') {
		response = { error: { message: 'server error' } };
	} else {
		console.error(error);
		response = { message: error.message, error };
	}
	res.status(500).json(response);
});

app.use(errorHandler);

module.exports = app;
