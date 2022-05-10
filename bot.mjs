import TeleBot from "telebot"

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN)

bot.on('text', msg => msg.text.startsWith('/') ? null : msg.reply.text(msg.text))

bot.on('/start', (msg) => msg.reply.photo('https://picsum.photos/1000'));

bot.on('/env', (msg) => msg.reply.text(process.env.VERCEL_ENV));

export default bot
