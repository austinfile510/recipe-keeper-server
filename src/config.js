module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: 'postgres://ohsblttbucrwxq:cf9cea675a4fbc653c221c9dbd5e9a0fe8f7b361d3effc53bc494b7b9f3e68a2@ec2-34-230-167-186.compute-1.amazonaws.com:5432/d9jj7bc3tvnqqc'
    TEST_DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dunder_mifflin:interactive@localhost/recipe-keeper-test',
    JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '1d',
  }