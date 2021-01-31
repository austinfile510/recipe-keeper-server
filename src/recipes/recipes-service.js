const knex = require('knex');
const xss = require('xss');

const RecipesService = {
	getAllRecipes(knex) {
		return knex.select('*').from('recipes');
	},

	getRecipeById(knex, id) {
		return knex.from('recipes').select('*').where('id', id).first();
	},

	getRecipeByMealType(knex, meal_type) {
		return knex
			.from('recipes')
			.select('*')
			.where('meal_type', meal_type)
			.first();
	},

	getRecipesByUser(knex, user_id) {
		return knex.from('recipes').select('*').where('user_id', user_id).first();
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
	}
};

module.exports = RecipesService;
