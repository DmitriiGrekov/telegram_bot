const pg = require('pg');

const pgConfig = {
    user: 'postgres',           // имя пользователя базы данных
    database: 'user_db',       // база данных
    password: 'root',       // Пароль базы данных
    host: '127.0.0.1',        // IP базы данных
    port: '5432'                // порт подключения
};

module.exports = new pg.Pool(pgConfig);