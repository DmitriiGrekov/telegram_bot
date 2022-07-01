const { Telegraf, Markup } = require('telegraf')
var moment = require('moment');
const pool = require('./db')
const options = require('./modules');
const bot = new Telegraf("5339895251:AAGN49MpOqcbz_RPuO5txDJjFCJRR_phOpo")

async function notifyAdminUser(user){
    //Уведомление администраторов о действии пользователей

    const res = await pool.selectAdminUser();
    const admins = res.rows;

    admins.forEach(admin => {
        if(user[0].state == 'user_worker'){

            bot.telegram.sendMessage(admin.tg_id, `Пользователь @${user[0].tg_name} получил работу`);
        }
        else if(user[0].state == 'user_wait'){

            bot.telegram.sendMessage(admin.tg_id, `Пользователь @${user[0].tg_name} оставил заявку на работу. Готов стартануть ${options.formatDate(user[0].date_time_start)}`);
        }
    });
}

async function showUnemployedUser(ctx){
    // Действие при нажатии кнопки показать незанятых пользователей

    const res = await pool.selectUnemployedUser();
    const users = res.rows;

    if(users.length > 0){
        let text = "";
        users.forEach(user => {
            text += `Пользователь @${user.tg_name} ожидает работы и готов стартануть ${options.formatDate(user.date_time_start)}\n------------------------------\n`;
        });
        ctx.reply(text);
    }
    else{
        ctx.reply('Все пользователи заняты');
    }
}

async function noJob(ctx){
    // Приветственное сообщение

    ctx.reply(`Все отлично, удачной работы, ваша роль пользователь. Нажмите кнопку "Нет работы", чтобы начать работать`, {
                    reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        keyboard: [
                            ['Нет работы'],
                        ]
                    })
                });
}

async function selectStartDate(ctx, current_state, chatId){
    // Выбор даты начала работы пользователя

    if(current_state != 'select_start_date') await pool.setUserState('select_start_date', chatId);
    var defaultButton = {
        text: 'Выбрать дату и время',
        web_app: {
            url: 'https://expented.github.io/tgdtp/'
        }
    }
    var print = 'Выберите, когда начинаете по мск'
    ctx.reply(print, {
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [ defaultButton, 'Сейчас'],
            ]
        })
    })
}

async function selectEndDate(ctx, current_state, chatId){
    // Выбор даты окончиания работы пользователя

    if(current_state != "select_end_date") await pool.setUserState('select_end_date', chatId)
    var defaultButton = {
                    text: 'Выбрать дату и время',
                    web_app: {
                        url: 'https://expented.github.io/tgdtp/'
                    }
                }
            
    var print = 'Выберите дату окончания работы (по мск)';
        
    ctx.reply(print, {
            reply_markup: JSON.stringify({
                resize_keyboard: true,
                keyboard: [
                    [ defaultButton],
                ]
            })
    })
}

async function userWait(ctx, current_state, chatId){
    // Действие, после оформления заявки пользователя

    if(current_state != 'user_wait') await pool.setUserState('user_wait', chatId);

    const user = await pool.checkUser(chatId);

    ctx.reply(`Вы успешно задали время работы. Время начала работы ${options.formatDate(user[0].date_time_start)}. Время окончания работы ${options.formatDate(user[0].date_time_end)}. Ожидайте сообщения от пм.`, 
                        {reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        keyboard: [
                            [ 'Заняли'],
                        ]
    })});
    notifyAdminUser(user);
}

async function userWorker(ctx, current_state, chatId){
    // Действие при нажатии кнопки Заняли

    if(current_state != 'user_worker') await pool.setUserState('user_worker', chatId);

    ctx.reply(`Хорошей вам работы. После окончания работы нажмите кнопку "Закончить работу", чтобы взять новый заказ`,  
            {reply_markup: JSON.stringify({
                resize_keyboard: true,
                keyboard: [
                    ['Закончить работу'],
                ]
            })})
    const user = await pool.checkUser(chatId);
    notifyAdminUser(user);
}

bot.start(async (ctx) => {
    // Действие при вводе команды /start

    const chatId = ctx.update.message.from.id;
    await pool.setUserState('start', chatId);
    const user = await pool.checkUser(chatId);
    
    if(user.length > 0){

        if(user[0].role_name == 'user' && user[0].state == 'start'){
            ctx.reply(`Все отлично, удачной работы, ваша роль пользователь. Нажмите кнопку "Нет работы", чтобы начать работать.`, {reply_markup: JSON.stringify({
                resize_keyboard: true,
                keyboard: [
                    ['Нет работы'],
                ]
            })});
        }
        else if(user[0].role_name == 'admin'){
            ctx.reply(`Приветствую, администратор. Чтобы посмотреть всех незанятых пользователей нажмите кнопку "Показать незанятых пользователей"`, 
                    {reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        keyboard: [
                            ['Показать незанятых пользователей'],
                        ]
                    })}
                    );
        }
    }
    else{
        ctx.reply(`У вас нет доступа, попросите добавить ваш id = ${ctx.update.message.from.id}, ваш телеграм никнейм = ${ctx.update.message.from.username}`)
    }

})

bot.on('text', async (ctx) => {
    // Основная функция бота

    const chatId = ctx.update.message.from.id;
    const user = await pool.checkUser(chatId);
    const text = ctx.update.message.text;
    let state = null;

    if(user.length > 0){
        state = user[0].state;
    }

    if(user.length > 0){
        if(user[0].role_name == 'user'){
            if(text == 'Нет работы'){
                await selectStartDate(ctx, state, chatId);
            }
            else if(text == 'Сейчас' && state == 'select_start_date'){
                var testDateUtc = moment.utc();
                var localDate = moment(testDateUtc).utcOffset(3).format();
                await pool.setUserStartDate(chatId, localDate);
                await selectEndDate(ctx, state, chatId);
            }
            else if(text == 'Заняли' && state == 'user_wait'){
                await pool.setUserStatus(chatId, 'worker');
                await userWorker(ctx, state, chatId);
            }
            else if(text == 'Закончить работу' && state == 'user_worker'){
                await pool.setUserState('start', chatId);
                await pool.setUserStatus(chatId, 'unemployed')
                await pool.clearUserDateTime(chatId);
                noJob(ctx);
            }
            else if(text == 'Еще актуально' && state == 'user_wait'){
                ctx.reply('Отлично, пм ищут вам работу, ожидайте');
            }
            else{
                if(state == 'start'){
                    noJob(ctx);
                }
                else if(state == 'select_start_date'){
                    selectStartDate(ctx, state, chatId);
                }
                else if(state == 'select_end_date'){
                    selectEndDate(ctx, state, chatId);
                }
                else if(state == 'user_wait'){
                    ctx.reply(`Вы успешно задали время работы. Время начала работы ${options.formatDate(user[0].date_time_start)}. Время окончания работы ${options.formatDate(user[0].date_time_end)}. Ожидайте сообщения от пм.`, 
                        {reply_markup: JSON.stringify({
                            resize_keyboard: true,
                            keyboard: [
                                [ 'Заняли'],
                            ]
                        })});
                }
                else if(state == 'user_worker'){
                    ctx.reply(`Хорошей вам работы. После окончания работы нажмите кнопку "Закончить работу", чтобы взять новый заказ`,  
                        {reply_markup: JSON.stringify({
                        resize_keyboard: true,
                            keyboard: [
                        ['Закончить работу'],
                        ]
                    })})
                }
            }
        }
        else if(user[0].role_name == 'admin'){
            if(text == 'Показать незанятых пользователей'){
                showUnemployedUser(ctx);
            }
            else{

            ctx.reply(`Приветствую, администратор. Чтобы посмотреть всех незанятых пользователей нажмите кнопку "Показать незанятых пользователей"`,
                    {reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        keyboard: [
                            ['Показать незанятых пользователей'],
                        ]
                    })}
                    );
            }
        }
    }
    else{
        ctx.reply(`У вас нет доступа, попросите добавить ваш id = ${ctx.update.message.from.id}, ваш телеграм никнейм = ${ctx.update.message.from.username}`)
    }
})

bot.on('web_app_data', async (ctx) => {
    // Действие при выборе даты и времени

    const chatId = ctx.update.message.from.id;
    const user = await pool.checkUser(chatId);
    let state = null;

    if(user.length > 0){
        state = user[0].state;
    }
	var [ timespamp, timezoneOffset ] = ctx.message.web_app_data.data.split('_')
	timespamp = parseInt(timespamp)
	var clientOffset = parseInt(timezoneOffset) * 60 * 1000
	var serverOffset = (new Date()).getTimezoneOffset() * 60 * 1000
	var offset = serverOffset - clientOffset
    var dateTimeUtc= moment(timespamp).format();

    if(state == 'select_start_date'){
        await pool.setUserStartDate(chatId, dateTimeUtc);
        await selectEndDate(ctx, state, chatId);
    }
    else if(state == 'select_end_date'){
        await pool.setUserEndDate(chatId, dateTimeUtc);
        await userWait(ctx, state, chatId);
    }
})

async function botNotify(){
    // Уведомление пользователя каждые 2 часа

    let res = await pool.notifyBot();
    let users = res.rows;

    users.forEach(user => {
        //Проверка статуса пользователя unemployed - без работы
        if(user.status == 'unemployed' && user.date_time_start){
            // Получение даты старта работы и текущей даты
            let startDate = moment(user.date_time_start).utcOffset(5).format('DD.MM.YYYY');
            let currentDate = moment.utc().utcOffset(3).format('DD.MM.YYYY');

            //Если дата старта и текущая дата совпадают получаем время старта и текущее время и сравниваем
            if(startDate == currentDate){
                let startTime = moment(user.date_time_start).utcOffset(5).format("H:mm");
                let currentTime = moment.utc().utcOffset(3).format("H:mm");
                let getDate = (string) => new Date(0, 0,0, string.split(':')[0], string.split(':')[1]); //получение даты из строки (подставляются часы и минуты
                let different = (getDate(currentTime) - getDate(startTime));

                let hours = Math.floor((different % 86400000) / 3600000);
                let minutes = Math.round(((different % 86400000) % 3600000) / 60000);
                let result = hours + ':' + minutes;
                //Каждые 2 часа отправляем сообщение
                    if(minutes == 0 && hours % 2 == 0 && hours != 0){
                        bot.telegram.sendMessage(user.tg_id,
                                                "Еще не заняли?",
                                                {reply_markup: JSON.stringify({
                                                    resize_keyboard: true,
                                                    keyboard: [
                                                        [ 'Заняли', 'Еще актуально'],
                                                    ]
                                                })})
                    }
                }
            }
        }
    )};

setInterval(botNotify, 1000 * 60);

// Запуск бота
bot.launch()
