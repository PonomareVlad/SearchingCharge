import TeleBot from "telebot"
import mongo from './db.mjs'

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN)

bot.on('/env', (msg) => msg.reply.text(process.env.VERCEL_ENV));
bot.on('text', async msg => {
    if (msg.text.startsWith('/')) return;
    let user = await fetchUser(msg.chat)
    const data = {id: user.id, count: user.count ? ++user.count : 1}
    user = await fetchUser(data)
    return msg.reply.text(`${msg.text} — ${user.count}`)
})

export default bot

const users = mongo.db('Telegram').collection('Users')

async function fetchUser(data) {
    const filter = {id: data.id}
    await users.updateOne(filter, {$set: data}, {upsert: true})
    return await users.findOne(filter)
}
