const { Telegraf, Markup } = require('telegraf')
var moment = require('moment');
const pool = require('./db')


const bot = new Telegraf("5339895251:AAGN49MpOqcbz_RPuO5txDJjFCJRR_phOpo")


function getTime(offset)
        {
            var d = new Date();
            localTime = d.getTime();
            localOffset = d.getTimezoneOffset() * 60000;

            // obtain UTC time in msec
            utc = localTime + localOffset;
            // create new Date object for different city
            // using supplied offset
            var nd = new Date(utc + (3600000*offset));
            //nd = 3600000 + nd;
            utc = new Date(utc);
            // return time as a string
            return utc;
        }

async function checkUser(chatId){

    const res = await pool.query(`select telegram_users.id, telegram_users.state, telegram_users.first_name, telegram_users.last_name, telegram_users.middle_name, telegram_users.tg_id, telegram_users.tg_name, telegram_users.date_time_start, telegram_users.date_time_end, roles.name as role_name from telegram_users inner join roles on telegram_users.role_id=roles.id where telegram_users.tg_id=${chatId};`)
    return res.rows
}

async function setUserState(state, chatId){
    const res = await pool.query(`UPDATE telegram_users SET state = '${state}' WHERE tg_id=${chatId};`)
    return res.rows;
}

async function setUserStartDate(chatId, startDate){
    const res = await pool.query(`UPDATE telegram_users SET date_time_start = '${startDate}' WHERE tg_id=${chatId}`);
    return res.rows;
}

async function setUserEndDate(chatId, endDate){
    const res = await pool.query(`UPDATE telegram_users SET date_time_end = '${endDate}' WHERE tg_id=${chatId}`);
    return res.rows;
}



async function noJob(ctx){
    ctx.reply(`Все отлично, ваша роль пользователь`, Markup.keyboard(['Нет работы']));
}

async function selectStartDate(ctx, current_state, chatId){

            if(current_state != 'select_start_date') await setUserState('select_start_date', chatId);

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
    if(current_state != "select_end_date") await setUserState('select_end_date', chatId)
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
    if(current_state != 'user_wait') await setUserState('user_wait', chatId);
    const user = await checkUser(chatId);

    ctx.reply(`Вы успешно задали время работы. Время начала работы ${user[0].date_time_start} время окончания работы ${user[0].date_time_end}. Ожидайте сообщения от пм.`, Markup.keyboard([['Заняли']]));


}




bot.start(async (ctx) => {

    const chatId = ctx.update.message.from.id;
    await setUserState('start', chatId);
    const user = await checkUser(chatId);
    
    if(user.length > 0){

        if(user[0].role_name == 'user' && user[0].state == 'start'){
            ctx.reply(`Все отлично, ваша роль пользователь`, Markup.keyboard(['Нет работы']));
        }

    }
    else{
        ctx.reply(`У вас нет доступа, попросите добавить ваш id = ${ctx.update.message.from.id}, ваш телеграм никнейм = ${ctx.update.message.from.username}`)
    }

})

bot.on('text', async (ctx) => {
    const chatId = ctx.update.message.from.id;
    const user = await checkUser(chatId);
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
                await setUserStartDate(chatId, localDate);
                await selectEndDate(ctx, state, chatId);
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
                    userWait(ctx, state, chatId);
                }
            }


        }

    }
    else{
        ctx.reply(`У вас нет доступа, попросите добавить ваш id = ${ctx.update.message.from.id}, ваш телеграм никнейм = ${ctx.update.message.from.username}`)
    }
})


bot.on('web_app_data', async (ctx) => {
    const chatId = ctx.update.message.from.id;
    const user = await checkUser(chatId);
    let state = null;

    if(user.length > 0){
        state = user[0].state;
    }

	var [ timespamp, timezoneOffset ] = ctx.message.web_app_data.data.split('_')
	timespamp = parseInt(timespamp)

	var clientOffset = parseInt(timezoneOffset) * 60 * 1000
	var serverOffset = (new Date()).getTimezoneOffset() * 60 * 1000
	var offset = serverOffset - clientOffset


    console.log(state);

    var dateTimeUtc= moment(timespamp).format();

    if(state == 'select_start_date'){
        await setUserStartDate(chatId, dateTimeUtc);
        await selectEndDate(ctx, state, chatId);
    }
    else if(state == 'select_end_date'){
        await setUserEndDate(chatId, dateTimeUtc);
        await userWait(ctx, state, chatId);

    }

})



async function botNotify(){

    let res = await pool.query(`select telegram_users.id, telegram_users.state, telegram_users.first_name, telegram_users.last_name, telegram_users.middle_name, telegram_users.tg_id, telegram_users.tg_name, telegram_users.date_time_start, telegram_users.date_time_end, telegram_users.status, roles.name as role_name from telegram_users inner join roles on telegram_users.role_id=roles.id;`);

    let users = res.rows;

    users.forEach(user => {
        let startDateTime = moment(user.date_time_start).utcOffset(5).format("H:mm");
        let currentTime = moment.utc().utcOffset(3).format("H:mm");
        let getDate = (string) => new Date(0, 0,0, string.split(':')[0], string.split(':')[1]); //получение даты из строки (подставляются часы и минуты
        let different = (getDate(currentTime) - getDate(startDateTime));

        let hours = Math.floor((different % 86400000) / 3600000);
        let minutes = Math.round(((different % 86400000) % 3600000) / 60000);
        let result = hours + ':' + minutes;

        if(minutes == 0 && hours % 2 == 0){
            bot.telegram.sendMessage(user.tg_id, "Каждые 2 часа")
        }
    

        console.log(`Время начала работы = ${startDateTime}, текущее время ${currentTime}, разница во времени ${result}` );
    
    });

   


}

setInterval(botNotify, 1000 * 60);





bot.launch()
