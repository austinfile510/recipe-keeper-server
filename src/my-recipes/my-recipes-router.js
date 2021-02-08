const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const { requireAuth } = require('../middleware/jwt-auth');
const RecipesService = require('../recipes/recipes-service');

const myRecipesRouter = express.Router();

const serializeRecipe = (recipe) => ({
	id: recipe.id,
	title: xss(recipe.title),
	description: xss(recipe.description),
	ingredients: xss(recipe.ingredients),
	instructions: xss(recipe.instructions),
	meal_type: recipe.meal_type,
	is_private: recipe.is_private,
	date_modified: recipe.date_modified,
	author: recipe.author,
	user_id: recipe.user_id,
});

// My Recipes Route
myRecipesRouter
	.route('/')
	.get(requireAuth, (req, res, next) => {
		const currentUser = req.user.id;
		const knexInstance = req.app.get('db');
		RecipesService.getRecipesByUser(knexInstance, currentUser).then(
			(recipes) => {
				res.json(recipes.map(serializeRecipe));
			}
		);
    });
    
    module.exports = myRecipesRouter