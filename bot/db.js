const pg = require('pg');

const pgConfig = {
    user: 'postgres',           // имя пользователя базы данных
    database: 'user_db',       // база данных
    password: 'root',       // Пароль базы данных
    host: '127.0.0.1',        // IP базы данных
    port: '5432'                // порт подключения
};

var pool = new pg.Pool(pgConfig);

module.exports = {
    checkUser: async (chatId) => {
        const res = await pool.query(`select telegram_users.id, telegram_users.state, telegram_users.first_name, telegram_users.last_name, telegram_users.middle_name, telegram_users.tg_id, telegram_users.tg_name, telegram_users.date_time_start, telegram_users.date_time_end, roles.name as role_name from telegram_users inner join roles on telegram_users.role_id=roles.id where telegram_users.tg_id=${chatId};`)
        return res.rows
    },
    setUserState: async (state, chatId) => {
        const res = await pool.query(`UPDATE telegram_users SET state = '${state}' WHERE tg_id=${chatId};`)
        return res.rows;
    },
    setUserStartDate: async (chatId, startDate) => {
        const res = await pool.query(`UPDATE telegram_users SET date_time_start = '${startDate}' WHERE tg_id=${chatId}`);
        return res.rows;
    },
    setUserEndDate: async (chatId, endDate) => {
        const res = await pool.query(`UPDATE telegram_users SET date_time_end = '${endDate}' WHERE tg_id=${chatId}`);
        return res.rows;
    },
    setUserStatus: async (chatId, status) => {
        const res = await pool.query(`UPDATE telegram_users SET status = '${status}' where tg_id = ${chatId}`);
        return res.rows;
    },
    clearUserDateTime: async (chatId) => {
        const res = await pool.query(`UPDATE telegram_users SET date_time_start=NULL, date_time_end=NULL where tg_id = ${chatId}`);
        return res.rows;
    },
    selectAdminUser: async () => {
        const res = await pool.query("select roles.name as role_name, telegram_users.tg_id from roles inner join telegram_users on roles.id=telegram_users.role_id where roles.name='admin';")
        return res;
    },
    selectUnemployedUser: async () => {
        const res = await pool.query("select telegram_users.id, telegram_users.state, telegram_users.first_name, telegram_users.last_name, telegram_users.middle_name, telegram_users.tg_id, telegram_users.tg_name, telegram_users.date_time_start, telegram_users.date_time_end, roles.name as role_name from telegram_users inner join roles on telegram_users.role_id=roles.id where roles.name='user' and telegram_users.status='unemployed' and telegram_users.state='user_wait';")
        return res;
    },
    notifyBot: async() => {
        let res = await pool.query(`select telegram_users.id, telegram_users.state, telegram_users.first_name, telegram_users.last_name, telegram_users.middle_name, telegram_users.tg_id, telegram_users.tg_name, telegram_users.date_time_start, telegram_users.date_time_end, telegram_users.status, roles.name as role_name from telegram_users inner join roles on telegram_users.role_id=roles.id;`);
        return res;
    }
}