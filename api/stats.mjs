import mongo from '../src/db.mjs'
import {readFileSync} from "fs";

const data = JSON.parse(readFileSync(new URL('../src/data.json', import.meta.url)).toString())
const users = mongo.db('Telegram').collection('Users')

export default async (req, {json}) => {
    const usersArray = await users.find().toArray()
    const final = usersArray.filter(({final}) => final).length
    const questions = Object.fromEntries(new Array(data.questions.length).fill(true).map((_, i) => [i + 1, 0]))
    usersArray.forEach(({question}) => isNaN(questions[question + 1]) ? null : questions[question + 1]++)
    json({users: usersArray.length, final, ...questions})
}
