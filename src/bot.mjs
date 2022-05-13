import {readFileSync} from "fs"
import TeleBot from "telebot"
import mongo from './db.mjs'

const data = JSON.parse(readFileSync(new URL('data.json', import.meta.url)).toString())
const users = mongo.db('Telegram').collection('Users')
const bot = new TeleBot({
    token: process.env.TELEGRAM_BOT_TOKEN,
    buildInPluginsFolder: '../../../../src/plugins/',
    buildInPlugins: ['shortReply']
})
export default bot

const isCommand = text => text && text[0] === '/'

async function fetchUser(data) {
    const filter = {id: data.id}
    if (data.id) delete data.id;
    if (data._id) delete data._id;
    await users.updateOne(filter, {$set: data}, {upsert: true})
    return await users.findOne(filter)
}

class Message {
    keyboardOptions = {once: true, resize: true}

    constructor(msg) {
        Object.assign(this, msg)
    }

    send(data) {
        if (typeof data == "string") return this.reply.text(data)

        if (data.messages && Array.isArray(data.messages))
            return data.messages.reduce((promise, message) => promise.then(() => this.send(message)), Promise.resolve())

        const options = {}

        if (!data.buttons && data.button) data.buttons = [data.button]
        if (data.buttons) data.keyboard = this.parseButtons(data.buttons)
        if (data.keyboard) options.replyMarkup = bot.keyboard(this.wrapKeyboard(data.keyboard), this.keyboardOptions)
        if (!data.inlineButtons && data.inlineButton) data.inlineButtons = [data.inlineButton]
        if (data.inlineButtons) data.inlineKeyboard = this.parseInlineButtons(data.inlineButtons)
        if (data.inlineKeyboard) options.replyMarkup = bot.inlineKeyboard(this.wrapKeyboard(data.inlineKeyboard))

        if (data.photo) {
            if (data.text) options.caption = data.text;
            return this.reply.photo(data.photo, options)
        }
        return this.reply.text(data.text, options)
    }

    parseButtons(buttons = []) {
        return buttons.map(button => Array.isArray(button) ? this.parseButtons(button) : bot.button(button))
    }

    parseInlineButtons(buttons = []) {
        if (Array.isArray(buttons)) return buttons.map(button => this.parseInlineButtons(button))
        const {label, ...options} = buttons
        return bot.inlineButton(label, options)
    }

    wrapKeyboard(keyboard = []) {
        if (Array.isArray(keyboard)) {
            if (Array.isArray(keyboard[0])) return keyboard;
            return [keyboard]
        }
        return [[keyboard]]
    }
}

bot.on('/env', (msg) => msg.reply.text(process.env.VERCEL_ENV))

bot.on('/start', async msg => {
    await fetchUser({...msg.chat, start: false, final: false, question: 0})
    return new Message(msg).send(data.intro)
});

bot.on('text', async msg => {
    if (isCommand(msg.text)) return
    let skipAnswer;
    const message = new Message(msg)
    let user = await fetchUser(msg.chat)

    if (!user.start) {
        if (msg.text === data.intro.answer) {
            user.start = true;
            user.question = 0;
            user = await fetchUser(user)
            skipAnswer = true;
        } else return message.send(data.intro)
    }

    if (!skipAnswer && data.questions[user.question]) {
        if (msg.text === data.questions[user.question].answer) {
            user.question++;
            user = await fetchUser(user)
        } else return message.send(data.error);
    }

    if (user.question < data.questions.length) return message.send(data.questions[user.question])

    if (!user.final) {
        user.final = true;
        user = await fetchUser(user)
        return message.send(data.final)
    }
})
