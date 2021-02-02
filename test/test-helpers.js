const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
	return [
		{
			id: 1,
			user_name: 'test-user-1',
			full_name: 'Test user 1',
			password: 'password',
			email: 'email1@gmail.com',
			date_created: '2021-02-01T07:28:20.717Z',
		},
		{
			id: 2,
			user_name: 'test-user-2',
			full_name: 'Test user 2',
			password: 'password',
			email: 'email2@gmail.com',
			date_created: '2021-02-01T07:28:20.717Z',
		},
		{
			id: 3,
			user_name: 'test-user-3',
			full_name: 'Test user 3',
			password: 'password',
			email: 'email3@gmail.com',
			date_created: '2021-02-01T07:28:20.717Z',
		},
		{
			id: 4,
			user_name: 'test-user-4',
			full_name: 'Test user 4',
			password: 'password',
			email: 'email4@gmail.com',
			date_created: '2021-02-01T07:28:20.717Z',
		},
	];
}

function makeRecipesArray() {
	return [
		{
			id: 1,
			title: 'First test recipe!',
			description: 'How-to',
			ingredients: 'Love',
			instructions:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			date_modified: '2021-02-01T07:28:20.717Z',
			meal_type: 'Breakfast',
			is_private: true,
			user_id: 1,
		},
		{
			id: 2,
			title: 'Second test recipe!',
			description: 'How-to',
			ingredients: 'Love',
			instructions:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			date_modified: '2021-02-01T07:28:20.717Z',
			meal_type: 'Lunch',
			is_private: false,
			user_id: 2,
		},
		{
			id: 3,
			title: 'Third test recipe!',
			description: 'How-to',
			ingredients: 'Love',
			instructions:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			date_modified: '2021-02-01T07:28:20.717Z',
			meal_type: 'Dinner',
			is_private: true,
			user_id: 3,
		},
		{
			id: 4,
			title: 'Fourth test recipe!',
			description: 'How-to',
			ingredients: 'Love',
			instructions:
				'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			date_modified: '2021-02-01T07:28:20.717Z',
			meal_type: 'Dessert',
			is_private: false,
			user_id: 4,
		},
	];
}

function makeExpectedRecipe(recipe) {
	return {
		id: recipe.id,
		title: recipe.title,
		description: recipe.description,
		ingredients: recipe.ingredients,
		instructions: recipe.instructions,
		date_modified: recipe.date_modified.toISOString(),
		meal_type: recipe.meal_type,
		is_private: recipe.is_private,
		user_id: recipe.user_id,
	};
}

function makeMaliciousRecipe(user) {
	const maliciousRecipe = {
		id: 911,
		title: 'Naughty naughty very naughty <script>alert("xss");</script>',
		description: 'Naughty naughty very naughty <script>alert("xss");</script>',
		ingredients: 'Naughty naughty very naughty <script>alert("xss");</script>',
		instructions: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
		date_modified: new Date(),
		meal_type: 'Dessert',
		is_private: 'false',
		user_id: user.id,
	};
	const expectedRecipe = {
		...maliciousRecipe,
		title:
			'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
		description:
			'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
		ingredients:
			'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
		instructions: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
	};
	return {
		maliciousRecipe,
		expectedRecipe,
	};
}

function makeRecipesFixtures() {
	const testUsers = makeUsersArray();
	const testRecipes = makeRecipesArray(testUsers);
	return { testUsers, testRecipes };
}

function cleanTables(db) {
	return db.transaction((trx) =>
		trx
			.raw(
				`TRUNCATE
        recipes,
        rk_users
      `
			)
			.then(() =>
				Promise.all([
					trx.raw(`ALTER SEQUENCE recipes_id_seq minvalue 0 START WITH 1`),
					trx.raw(`ALTER SEQUENCE rk_users_id_seq minvalue 0 START WITH 1`),
					trx.raw(`SELECT setval('recipes_id_seq', 0)`),
					trx.raw(`SELECT setval('rk_users_id_seq', 0)`),
				])
			)
	);
}

function seedUsers(db, users) {
	const preppedUsers = users.map((user) => ({
		...user,
		password: bcrypt.hashSync(user.password, 1),
	}));
	return db
		.into('rk_users')
		.insert(preppedUsers)
		.then(() =>
			// update the auto sequence to stay in sync
			db.raw(`SELECT setval('rk_users_id_seq', ?)`, [users.length - 1])
		);
}

function seedMaliciousRecipe(db, user, recipe) {
	return seedUsers(db, [user]).then(() => db.into('recipes').insert([recipe]));
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
	const token = jwt.sign({ user_id: user.id }, secret, {
		subject: user.user_name,
		algorithm: 'HS256',
	});
	return `Bearer ${token}`;
}

module.exports = {
	makeUsersArray,
	makeRecipesArray,
	makeExpectedRecipe,
	makeMaliciousRecipe,

	makeRecipesFixtures,
	cleanTables,
	seedMaliciousRecipe,
	makeAuthHeader,
	seedUsers,
};
