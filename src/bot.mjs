import Message from "./message.mjs"
import {readFileSync} from "fs"
import TeleBot from "telebot"
import mongo from './db.mjs'

const data = JSON.parse(readFileSync(new URL('data.json', import.meta.url)).toString()),
    users = mongo.db('Telegram').collection('Users'),
    isCommand = text => text && text[0] === '/',
    bot = new TeleBot({
        token: process.env.TELEGRAM_BOT_TOKEN,
        buildInPluginsFolder: '../../../src/plugins/',
        buildInPlugins: ['shortReply']
    })

bot.on('text', async msg => {
    if (isCommand(msg.text)) return
    let skipAnswer;
    const message = new Message(msg)
    let user = await fetchUser(msg.chat)

    if (!user.start) {
        if (msg.text === data.intro.answer) {
            user.start = true
            user.question = 0
            user = await fetchUser(user)
            skipAnswer = true
        } else return message.send(data.intro)
    }

    if (!skipAnswer && data.questions[user.question]) {
        if (checkAnswer(msg.text, data.questions[user.question])) {
            user.question++
            user = await fetchUser(user)
        } else return message.send(data.error)
    }

    if (user.question < data.questions.length) return message.send(data.questions[user.question])

    if (!user.final) {
        user.final = true
        user = await fetchUser(user)
        return message.send(data.final)
    }

    const pack = await bot.getStickerSet('farmlend_ru')
    return message.reply.sticker(pack.stickers[Math.floor(Math.random() * pack.stickers.length)].file_id)
})

bot.on('callbackQuery', async msg => {
    const user = await fetchUser(msg.message.chat)
    switch (msg.data) {
        case 'question':
            return Message.sendTo(user.id, data.questions[user.question])
    }
})

bot.on('/start', async msg => {
    await fetchUser({...msg.chat, start: false, final: false, question: 0})
    return new Message(msg).send(data.intro)
});

bot.on(['/PS', '/author', '/dev', '/developer', '/about', '/copyright', '/help'], async msg => {
    await msg.reply.sticker('https://ponomarev.studio/images/logo/LargeBlack.webp')
    return msg.reply.text('Разработано в @PonomarevStudio 🚀')
})

bot.on('/env', (msg) => msg.reply.text(process.env.VERCEL_ENV))

function checkAnswer(answer = '', question = {}) {
    const adaptedAnswer = answer.toString().toLowerCase().replace(/[^0-9A-Za-z_\u0400-\u04FF]/gi, '').trim()
    const questionAnswers = (question.answer ? [question.answer] : (question.answers || [])).map(answer => answer.toString().toLowerCase().trim())
    return questionAnswers.some(answer => adaptedAnswer.includes(answer))
}

async function fetchUser(data) {
    const filter = {id: data.id}
    if (data.id) delete data.id;
    if (data._id) delete data._id;
    await users.updateOne(filter, {$set: data}, {upsert: true})
    return await users.findOne(filter)
}

export default bot
