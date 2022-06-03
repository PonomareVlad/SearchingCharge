import mongo from "./db.mjs";

export const users = mongo.db('Telegram').collection('Users')
