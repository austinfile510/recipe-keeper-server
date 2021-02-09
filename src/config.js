module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_ENDPOINT: process.env.REACT_APP_API_ENDPOINT || "http://localhost:3000/api",
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dunder_mifflin:interactive@localhost/recipe-keeper',
    TEST_DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dunder_mifflin:interactive@localhost/recipe-keeper-test',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'https://recipe-keeper-client-e2e1ckox7.vercel.app/'
    JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '1d',

  }