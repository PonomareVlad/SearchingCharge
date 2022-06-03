import mongo from '../src/db.mjs'
import {users} from "./user.mjs"
import {tasks} from "./queue.mjs"

export const broadcasts = mongo.db("Telegram").collection("Broadcasts")

export default class Broadcast {
    constructor(data = {method: 'sendMessage', args: []}) {
        this.data = data
    }

    static getLastID = () => broadcasts.findOne({}, {sort: {id: -1}}).then(({id} = {}) => id || 0).catch(() => 0)

    static fromData(data, query) {
        return new this(data).init(query)
    }

    static async fromMessage(msg, query) {
        return new this({method: 'copyMessage', args: [msg.chat.id, msg.message_id], source: msg}).init(query)
    }

    async init(query) {
        await this.setID()
        const publish = await this.publish(),
            tasks = await this.createTasks(query)
        return Object.assign({...this, publish, tasks})
    }

    setID = async () => this.data.id = (await this.constructor.getLastID()) + 1

    publish = (id = this.data.id) => broadcasts.replaceOne({id}, this.data, {upsert: true})

    createTasks = async (query, tasksList = this.getTasks(query)) => {
        const targetTasks = await tasksList
        if (!targetTasks.length) return console.debug('Empty tasks list', targetTasks)
        return tasks.insertMany(targetTasks)
    }

    getTasks = async (query = {}) => users.find(query).map(({id}) => ({
        status: 'new', task: 'sendBroadcast', user: id, broadcast: this.data.id
    })).toArray()
}
