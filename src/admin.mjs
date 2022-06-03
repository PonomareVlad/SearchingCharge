import bot from "./bot.mjs"
import mongo from './db.mjs'
import Broadcast from './broadcast.mjs'

export const admins = mongo.db("Telegram").collection("Admins")

export default class Admin {

    static message(msg) {
        return bot.sendMessage(msg.chat.id, 'Отправить это сообщение в рассылку ?', {
            replyToMessage: msg.message_id,
            replyMarkup: bot.inlineKeyboard([[bot.inlineButton('Отправить', {callback: 'send'})]])
        })
    }

    static async callback(query) {
        await bot.answerCallbackQuery(query.id, {text: 'Запуск рассылки...', cacheTime: 60})
        const broadcast = await Broadcast.fromMessage(query.message.reply_to_message)
        return await bot.editMessageText({
            chatId: query.message.chat.id,
            messageId: query.message.message_id
        }, `Сообщение отправлено в рассылку !
        
Номер рассылки: ${broadcast.data.id}

Количество получателей: ${broadcast.tasks.insertedCount}`)
    }

    static isAdmin = async id => admins.findOne({id})
}
