import bot from "../bot.mjs"
import {broadcasts} from '../broadcast.mjs'

export default async ({broadcast: id, user}) => {
    const {method, args} = await broadcasts.findOne({id})
    console.debug({id, user, method, args})
    return await bot[method](user, ...args)
}
