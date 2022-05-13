import bot from '../src/bot.mjs'

export default async ({body}, {json}) =>
    json(body && body.update_id ? await bot.receiveUpdates([body]) : {status: false})
