const TelegramApi = require('node-telegram-bot-api');
const pool = require('./db')

const token = '5339895251:AAGN49MpOqcbz_RPuO5txDJjFCJRR_phOpo';


const bot = new TelegramApi(token, {polling: true})

async function checkUser(chatId){

    const res = await pool.query(`select telegram_users.id, telegram_users.first_name, telegram_users.last_name, telegram_users.middle_name, telegram_users.tg_id, telegram_users.tg_name, roles.name as role_name from telegram_users inner join roles on telegram_users.role_id=roles.id where telegram_users.tg_id=${chatId};`)
    console.log(res.rows)
    return res.rows
}


async function start() {
                try {
                    bot.on('message', async msg => {
                        const text = msg.text;
                        const chatId = msg.chat.id;
                        const users = await checkUser(chatId);

                        if (users.length > 0) {

                            bot.sendMessage(chatId, `Все отлично, ваша роль ${users[0].role_name}`);
                        }
                        else {
                            bot.sendMessage(chatId, `У вас нет доступа, попросите добавить ваш id = ${chatId}, ваш телеграм никнейм = ${msg.from.username} `);
                            return 0;
                        }
                    });


                }
                catch (e) {
                    console.log('Подключение к бд не произошло', e);
                }

            }


start()
