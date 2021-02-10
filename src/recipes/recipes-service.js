const knex = require('knex');
const xss = require('xss');

const RecipesService = {
	getAllRecipes(knex) {
		// Gets public recipes
		return knex.select('*').from('recipes').where('is_private', false);
	},

	getRecipeById(knex, id) {
		return knex.from('recipes').select('*').where('id', id).first();
	},

	getRecipesByUser(knex, user_id) {
		// Gets recipe by UserId. Used for /my-recipes
		return knex.from('recipes').select('*').where('user_id', user_id);
	},

	insertRecipe(knex, newRecipe) {
		return knex
			.insert(newRecipe)
			.into('recipes')
			.returning('*')
			.then((rows) => {
				return rows[0];
			});
	},

	deleteRecipe(knex, id) {
		return knex('recipes').where({ id }).delete();
	},

	updateRecipe(knex, id, newRecipeFields) {
		return knex('recipes').where({ id }).update(newRecipeFields);
	},
};

module.exports = RecipesService;
