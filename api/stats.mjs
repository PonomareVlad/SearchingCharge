import {users} from '../src/user.mjs'
import Queue from '../src/queue.mjs'
import {readFileSync} from "fs";

const data = JSON.parse(readFileSync(new URL('../src/data.json', import.meta.url)).toString())

export default async (req, {json}) => {
    const tasks = await Queue.availableTasksCount()
    const usersArray = await users.find().toArray()
    const final = usersArray.filter(({final}) => final).length
    const questions = Object.fromEntries(new Array(data.questions.length).fill(true).map((_, i) => [i + 1, 0]))
    usersArray.forEach(({question}) => isNaN(questions[question + 1]) ? null : questions[question + 1]++)
    json({tasks, users: usersArray.length, final, ...questions})
}
