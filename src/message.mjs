import bot from "./bot.mjs"

export default class Message {
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
