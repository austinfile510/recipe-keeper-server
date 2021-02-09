const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
// const { requireAuth } = require('../middleware/jwt-auth');
const RecipesService = require('./recipes-service');

const recipesRouter = express.Router();
const jsonParser = express.json();

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

// Recipes Route

recipesRouter
	.route('/')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db');
		RecipesService.getAllRecipes(knexInstance)
			.then((recipes) => {
				res.json(recipes.map(serializeRecipe));
			})
			.catch(next);
	})
	.post(jsonParser, (req, res, next) => {
		const {
			title,
			description,
			ingredients,
			instructions,
			meal_type,
			is_private,
		} = req.body;
		const newRecipe = {
			title,
			description,
			ingredients,
			instructions,
			meal_type,
			is_private,
		};
		for (const [key, value] of Object.entries(newRecipe)) {
			if (!value) {
				logger.error(`${key} is required`);
				return res.status(400).send({
					error: { message: `'${key}' is required` },
				});
			}
		}

		newRecipe.user_id = req.user.id;
		newRecipe.author = req.user.user_name;
		const knexInstance = req.app.get('db');

		RecipesService.insertRecipe(knexInstance, newRecipe)
			.then((recipe) => {
				logger.info(`Recipe with id ${recipe.id} created.`);
				res
					.status(201)
					.location(path.posix.join(req.originalUrl + `/${recipe.id}`))
					.json(serializeRecipe(recipe));
			})
			.catch(next);
	});


// Recipe ID Route
recipesRouter
	.route('/:recipe_id')
	.all((req, res, next) => {
		const knexInstance = req.app.get('db');
		RecipesService.getRecipeById(knexInstance, req.params.recipe_id)
			.then((recipe) => {
				if (!recipe) {
					return res.status(404).json({
						error: { message: `Recipe doesn't exist` },
					});
				}
				res.recipe = recipe;
				next();
			})
			.catch(next);
	})

	.get((req, res) => {
		res.json(serializeRecipe(res.recipe));
	})

	.delete((req, res, next) => {
		const knexInstance = req.app.get('db');
		const { recipe_id } = req.params;
		RecipesService.deleteRecipe(knexInstance, req.params.recipe_id)
			.then((numRowsAffected) => {
				logger.info(`Recipe with id ${recipe_id} deleted.`);
				res.status(204).end();
			})
			.catch(next);
	})

	.patch(jsonParser, (req, res, next) => {
		const {
			title,
			description,
			ingredients,
			instructions,
			meal_type,
			is_private,
		} = req.body;
		const recipeToUpdate = {
			title,
			description,
			ingredients,
			instructions,
			meal_type,
			is_private,
		};

		const numberOfValues = Object.values(recipeToUpdate).filter(Boolean).length;
		if (numberOfValues === 0) {
			logger.error(`Invalid update without required fields`);
			return res.status(400).json({
				error: {
					message: `Request body must content either 'title', 'description', 'ingredients', 'instructions', 'meal_type', 'ingredients' or 'is_private'`,
				},
			});
		}

		const knexInstance = req.app.get('db');
		RecipesService.updateRecipe(
			knexInstance,
			req.params.recipe_id,
			recipeToUpdate
		)
			.then((numRowsAffected) => {
				res.status(204).end();
			})
			.catch(next);
	});

module.exports = recipesRouter;
