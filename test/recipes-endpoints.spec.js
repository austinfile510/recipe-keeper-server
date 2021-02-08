const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');
const { expect } = require('chai');

describe('Recipes Endpoints', function () {
	let db;

	const { testRecipes, testUsers } = helpers.makeRecipesFixtures();

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL,
		});
		app.set('db', db);
	});

	after('disconnect from db', () => db.destroy());

	before('cleanup', () => helpers.cleanTables(db));

	afterEach('cleanup', () => helpers.cleanTables(db));

	describe(`GET /api/recipes`, () => {
		context(`Given no recipes`, () => {
			it(`responds with 200 and an empty list`, () => {
				return supertest(app).get('/api/recipes').expect(200, []);
			});
		});

		context('Given there are recipes in the database', () => {
			const testUsers = helpers.makeUsersArray();
			const testRecipes = helpers.makeRecipesArray();

			beforeEach('insert recipes', () => {
				return db
					.into('rk_users')
					.insert(testUsers)
					.then(() => {
						return db.into('recipes').insert(testRecipes);
					});
			});

			it('responds with 200 and all of the recipes', () => {
				return supertest(app).get('/api/recipes').expect(200, testRecipes);
			});
		});

		context(`Given an XSS attack recipe`, () => {
			const testUser = helpers.makeUsersArray()[1];
			const { maliciousRecipe, expectedRecipe } = helpers.makeMaliciousRecipe(
				testUser
			);

			beforeEach('insert malicious recipe', () => {
				return helpers.seedMaliciousRecipe(db, testUser, maliciousRecipe);
			});

			it('removes XSS attack content', () => {
				return supertest(app)
					.get(`/api/recipes`)
					.expect(200)
					.expect((res) => {
						expect(res.body[0].title).to.eql(expectedRecipe.title);
						expect(res.body[0].instructions).to.eql(
							expectedRecipe.instructions
						);
					});
			});
		});
	});

	// Get Recipe by ID

	describe(`GET /api/recipes/:recipe_id`, () => {
		context(`Given no recipes`, () => {
			const testUsers = helpers.makeUsersArray();

			beforeEach('insert users', () => {
				return db.into('rk_users').insert(testUsers);
			});

			it(`responds with 404`, () => {
				const recipeId = 123456;
				return supertest(app)
					.get(`/api/recipes/${recipeId}`)
					.set('Authorization', helpers.makeAuthHeader(testUsers[1]))
					.expect(404, { error: { message: `Recipe doesn't exist` } });
			});
		});

		context(`Given there are recipes in the database`, () => {
			const testUsers = helpers.makeUsersArray();
			const testRecipes = helpers.makeRecipesArray();

			beforeEach('insert recipes', () => {
				return db
					.into('rk_users')
					.insert(testUsers)
					.then(() => {
						return db.into('recipes').insert(testRecipes);
					});
			});

			it(`responds with 200 and the specified recipe`, () => {
				const recipeId = 2;
				const expectedRecipe = testRecipes[recipeId - 1];
				return supertest(app)
					.get(`/api/recipes/${recipeId}`)
					.set('Authorization', helpers.makeAuthHeader(testUsers[1]))
					.expect(200, expectedRecipe);
			});
		});
	});

	// Delete Recipe

	describe(`DELETE /api/recipes/:recipe_id`, () => {
		context(`Given no recipes`, () => {
			const testUsers = helpers.makeUsersArray();

			beforeEach('insert users', () => {
				return db.into('rk_users').insert(testUsers);
			});

			it(`responds with 404 when recipe doesn't exist`, () => {
				const testUser = helpers.makeUsersArray()[1];
				return supertest(app)
					.delete(`/api/recipes/123`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, {
						error: { message: `Recipe doesn't exist` },
					});
			});
		});

		context(`Given there are recipes in the database`, () => {
			const testUsers = helpers.makeUsersArray();
			const testRecipes = helpers.makeRecipesArray();

			beforeEach('insert recipes', () => {
				return db
					.into('rk_users')
					.insert(testUsers)
					.then(() => {
						return db.into('recipes').insert(testRecipes);
					});
			});

			it(`removes the recipe by ID from the database`, () => {
				const testUser = helpers.makeUsersArray()[1];
				const idToRemove = 2;
				const expectedRecipe = testRecipes.filter((fr) => fr.id !== idToRemove);
				return supertest(app)
					.delete(`/api/recipes/${idToRemove}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(204)
					.then(() =>
						supertest(app)
							.get(`/api/recipes`)
							.set('Authorization', helpers.makeAuthHeader(testUser))
							.expect(expectedRecipe)
					);
			});
		});
	});

	// Insert Recipe

	describe(`POST /api/recipes`, () => {
		const testUsers = helpers.makeUsersArray();
		beforeEach('insert users', () => {
			return db.into('rk_users').insert(testUsers);
		});

		it(`adds a new recipe to the database`, () => {
			const testUser = testUsers[0];
			const newRecipe = {
				title: 'Chocolate Cake',
				description: 'Chocolate Cake with Frosting',
				ingredients: 'Chocolate, eggs, milk, flour, sugar, butter',
				instructions: 'Mix and bake at 450 degrees. Apply frosting',
				date_modified: new Date(),
				meal_type: 'Dessert',
				is_private: true,
			};
			return supertest(app)
				.post(`/api/recipes`)
				.send(newRecipe)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(201)
				.expect((res) => {
					expect(res.body.title).to.eql(newRecipe.title);
					expect(res.body.description).to.eql(newRecipe.description);
					expect(res.body.ingredients).to.eql(newRecipe.ingredients);
					expect(res.body.instructions).to.eql(newRecipe.instructions);
					expect(res.body.is_private).to.eql(newRecipe.is_private);
					expect(res.body.meal_type).to.eql(newRecipe.meal_type);
					expect(res.headers.location).to.eql(`/api/recipes/${res.body.id}`);
					const expected = new Intl.DateTimeFormat('en-US').format(new Date());
					const actual = new Intl.DateTimeFormat('en-US').format(
						new Date(res.body.date_modified)
					);
					expect(actual).to.eql(expected);
				})
				.then((res) =>
					supertest(app)
						.get(`/api/recipes/${res.body.id}`)
						.set('Authorization', helpers.makeAuthHeader(testUser))
						.expect(res.body)
				);
		});

		const requiredFields = [
			'title',
			'description',
			'ingredients',
			'instructions',
			'meal_type',
			'is_private',
		];

		requiredFields.forEach((field) => {
			const newRecipe = {
				title: 'Chocolate Cake',
				description: 'Chocolate Cake with Frosting',
				ingredients: 'Chocolate, eggs, milk, flour, sugar, butter',
				instructions: 'Mix and bake at 450 degrees. Apply frosting',
				date_modified: new Date(),
				meal_type: 'Dessert',
				is_private: true,
				user_id: 1,
			};

			it(`responds with 400 missing '${field}' if not supplied`, () => {
				const testUser = testUsers[1];
				delete newRecipe[field];

				return supertest(app)
					.post(`/api/recipes`)
					.send(newRecipe)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(400, {
						error: { message: `'${field}' is required` },
					});
			});
		});
	});

	// Update Recipe

	describe(`PATCH /api/recipes`, () => {
		context(`Given no recipes`, () => {
			const testUsers = helpers.makeUsersArray();

			beforeEach('insert users', () => {
				return db.into('rk_users').insert(testUsers);
			});

			it(`responds with 404 when recipe doesn't exist`, () => {
				const testUser = helpers.makeUsersArray()[1];
				return supertest(app)
					.delete(`/api/recipes/123`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, {
						error: { message: `Recipe doesn't exist` },
					});
			});
		});

		context(`Given there are recipes in the database`, () => {
			const testUsers = helpers.makeUsersArray();
			const testRecipes = helpers.makeRecipesArray();

			beforeEach('insert recipes', () => {
				return db
					.into('rk_users')
					.insert(testUsers)
					.then(() => {
						return db.into('recipes').insert(testRecipes);
					});
			});

			it('responds with 204 and updates the recipe', () => {
				const idToUpdate = 2;
				const testUser = testUsers[1];
				const updateRecipe = {
					title: 'updated-title',
					instructions: 'Updated recipes',
				};
				const expectedRecipe = {
					...testRecipes[idToUpdate - 1],
					...updateRecipe,
				};
				return supertest(app)
					.patch(`/api/recipes/${idToUpdate}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(updateRecipe)
					.expect(204)
					.then((res) => {
						return supertest(app)
							.get(`/api/recipes/${idToUpdate}`)
							.set('Authorization', helpers.makeAuthHeader(testUser))
							.expect(expectedRecipe);
					});
			});

			it(`responds with 400 when no required fields supplied`, () => {
				const testUser = testUsers[1];
				const idToUpdate = 2;
				return supertest(app)
					.patch(`/api/recipes/${idToUpdate}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send({ irrelevantField: 'foo' })
					.expect(400, {
						error: {
							message: `Request body must content either 'title', 'description', 'ingredients', 'instructions', 'meal_type', 'ingredients' or 'is_private'`,
						},
					});
			});

			it(`responds with 204 when updating only a subset of fields`, () => {
				const testUser = testUsers[1];
				const idToUpdate = 2;
				const updateRecipe = {
					title: 'updated recipe title',
				};
				const expectedRecipe = {
					...testRecipes[idToUpdate - 1],
					...updateRecipe,
				};

				return supertest(app)
					.patch(`/api/recipes/${idToUpdate}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send({
						...updateRecipe,
						fieldToIgnore: 'should not be in GET response',
					})
					.expect(204)
					.then((res) =>
						supertest(app)
							.get(`/api/recipes/${idToUpdate}`)
							.set('Authorization', helpers.makeAuthHeader(testUser))
							.expect(expectedRecipe)
					);
			});
		});
	});
});
