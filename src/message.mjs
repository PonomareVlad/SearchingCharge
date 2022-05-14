import bot from "./bot.mjs"

export default class Message {
    static keyboardOptions = this.constructor.keyboardOptions = {once: true, resize: true}

    constructor(msg) {
        Object.assign(this, msg)
    }

    static sendTo(id, data) {
        if (typeof data == "string") return bot.sendMessage(id, data)

        if (data.messages && Array.isArray(data.messages))
            return data.messages.reduce((promise, message) => promise.then(() => this.sendTo(id, message)), Promise.resolve())

        const options = {}

        const replyMarkup = this.parseReplyMarkup(data)
        if (replyMarkup) options.replyMarkup = replyMarkup

        if (data.photo) {
            if (data.text) options.caption = data.text;
            return bot.sendPhoto(id, data.photo, options)
        }
        return bot.sendMessage(id, data.text, options)
    }

    static parseReplyMarkup(data) {
        let replyMarkup, {button, buttons, keyboard, inlineButton, inlineButtons, inlineKeyboard} = data
        if (!buttons && button) buttons = [button]
        if (buttons && !keyboard) keyboard = this.parseButtons(buttons)
        if (keyboard) replyMarkup = bot.keyboard(this.wrapKeyboard(keyboard), this.keyboardOptions)
        if (!inlineButtons && inlineButton) inlineButtons = [inlineButton]
        if (inlineButtons && !inlineKeyboard) inlineKeyboard = this.parseInlineButtons(inlineButtons)
        if (inlineKeyboard) replyMarkup = bot.inlineKeyboard(this.wrapKeyboard(inlineKeyboard))
        return replyMarkup
    }

    static parseButtons(buttons = []) {
        return buttons.map(button => Array.isArray(button) ? this.parseButtons(button) : bot.button(button))
    }

    static parseInlineButtons(buttons = []) {
        if (Array.isArray(buttons)) return buttons.map(button => this.parseInlineButtons(button))
        const {label, ...options} = buttons
        return bot.inlineButton(label, options)
    }

    static wrapKeyboard(keyboard = []) {
        if (Array.isArray(keyboard)) {
            if (Array.isArray(keyboard[0])) return keyboard;
            return [keyboard]
        }
        return [[keyboard]]
    }

    send(data) {
        if (typeof data == "string") return this.reply.text(data)

        if (data.messages && Array.isArray(data.messages))
            return data.messages.reduce((promise, message) => promise.then(() => this.send(message)), Promise.resolve())

        const options = {}

        const replyMarkup = this.constructor.parseReplyMarkup(data)
        if (replyMarkup) options.replyMarkup = replyMarkup

        if (data.photo) {
            if (data.text) options.caption = data.text;
            return this.reply.photo(data.photo, options)
        }
        return this.reply.text(data.text, options)
    }
}
