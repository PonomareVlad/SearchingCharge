import TeleBot from "telebot"
import mongo from './db.mjs'
import Data from './data.mjs'

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN)

bot.on('/env', (msg) => msg.reply.text(process.env.VERCEL_ENV));
bot.on('/reset', async (msg) => msg.reply.text(JSON.stringify(await fetchUser({
    ...msg.chat,
    start: false,
    final: false,
    question: 0
}))));
bot.on('text', async msg => {
    if (msg.text.startsWith('/env') || msg.text.startsWith('/reset')) return;
    let user = await fetchUser(msg.chat);
    if (user.start) {
        if (user.question < Data.questions.length) {
            if (msg.text === Data.questions[user.question].answer) {
                user.question++;
                user = await fetchUser({id: user.id, question: user.question});
                if (!Data.questions[user.question]) {
                    user.final = true;
                    user = await fetchUser({id: user.id, final: user.final});
                    return await Data.final.reduce((promise, message) =>
                        promise.then(() => msg.reply.text(message)), Promise.resolve())
                }
                return await Data.questions[user.question].messages.reduce((promise, message) =>
                    promise.then(() => msg.reply.text(message)), Promise.resolve())
            } else return msg.reply.text(Data.error)
        } else {
            if (!user.final) {
                user.final = true;
                user = await fetchUser({id: user.id, final: user.final});
                return await Data.final.reduce((promise, message) =>
                    promise.then(() => msg.reply.text(message)), Promise.resolve())
            }
        }
    } else {
        if (msg.text === Data.button) {
            user.start = true;
            user.question = 0;
            user = await fetchUser({id: user.id, start: user.start, question: user.question});
            const url = Data.stickers.url;
            const replyMarkup = bot.inlineKeyboard([[bot.inlineButton(Data.stickers.button, {url})]]);
            await msg.reply.text(Data.stickers.message, {replyMarkup})
            return await Data.questions[user.question].messages.reduce((promise, message) =>
                promise.then(() => msg.reply.text(message)), Promise.resolve())
        } else {
            const replyMarkup = bot.keyboard([[bot.button(Data.button)]], {once: true, resize: true})
            return await Data.intro.reduce((promise, message) =>
                promise.then(() => msg.reply.text(message, {replyMarkup})), Promise.resolve())
        }
    }
})

export default bot

const users = mongo.db('Telegram').collection('Users')

async function fetchUser(data) {
    const filter = {id: data.id}
    await users.updateOne(filter, {$set: data}, {upsert: true})
    return await users.findOne(filter)
}
