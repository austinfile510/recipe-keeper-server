# Recipe Keeper

An Express API by Austin File
## Live App: 
https://recipe-keeper-client.vercel.app/

## Description/Summary
This is a simple-to-use recipe creation and storage app. Keep all your recipes in one place, right where you need them, when you need them!

You can start using the app by registering a new user account. Click "Register" at the top of the app's page and follow the instructions. After that, you'll be taken to the Login screen to sign in and start creating and keeping track of your recipes.


## Documentation
This API runs at the following endpoints:

/recipes - Acquires all public recipes in the database via GET request.
/recipes/:recipeId - Acquires recipe by ID. Used for GET, DELETE, and POST requests (retrieving, deleting, and creating new recipes)
/auth/login - Used to POST login requests
/users - Used to POST new users to the database.
/my-recipes - Gets the recipes for the currently logged in user.
### Technology Used
This project was bootstrapped with Express. [JWT](https://jwt.io/) is used for user authentication.

Additional Packages used: cors, dotenv, helmet, morgan, knex, winston, postgrator-cli, chai, mocha, nodemon