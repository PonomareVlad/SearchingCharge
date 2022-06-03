import mongo from '../src/db.mjs'
import asyncSleep from 'simple-async-sleep'
import {serializeError} from "serialize-error"

export const tasks = mongo.db("Telegram").collection("Tasks")

export default class Queue {
    log = []
    task

    static run() {
        return new this().run()
    }

    static getFilter = (status = 'new') => ({status, $or: [{callAfter: null}, {callAfter: {$lte: Date.now()}}]})

    async run() {
        const tasksCount = await tasks.countDocuments(this.constructor.getFilter())
        if (!tasksCount) return {message: 'Empty queue', tasksCount}
        console.debug('Tasks count: ', tasksCount)
        await this.emitTasks()
        return {tasksCount, log: this.log}
    }

    emitTasks = async () => {
        while (this.task = await this.getNextTask())
            await this.runTask(this.task).then(async result => this.logPush(result) && await this.deleteTask(this.task))
                .catch(this.handleError).finally(() => this.task = undefined)
    }

    getNextTask = async (filter = this.constructor.getFilter(), status = 'pending') =>
        (await tasks.findOneAndUpdate(filter, {$set: {status}}, {sort: {priority: -1}})).value

    runTask = async data => (await import(new URL(`tasks/${data.task}.mjs`, import.meta.url))).default(data, this)

    updateTask = async ({_id = 0} = {}, changes = {}) => _id ? await tasks.updateOne({_id}, {$set: changes}) : console.debug('Bad id: ', _id, changes)

    deleteTask = async ({_id = 0} = {}) => _id ? await tasks.deleteOne({_id}) : console.debug('Bad id: ', _id)

    handleError = async error => {
        console.error(error)
        this.log.push(error)
        try {
            switch (error.error_code) {
                case 429:
                    await this.updateTask(this.task, {status: 'new'})
                    console.debug('Task reverted')
                    const timeout = error?.parameters?.retry_after || 10
                    this.logPush(`Sleep for: ${timeout}s ...`)
                    await asyncSleep(timeout * 1000)
                    this.logPush('Awake !')
                    break;
                default:
                    switch (error.description) {
                        /*case 'Bad Request: chat not found':
                        case 'Forbidden: user is deactivated':
                        case 'Forbidden: bot was blocked by the user':
                            // await (await new Subscriber({id: this?.task?.subscriber})).set('state', 'paused')
                            // console.debug('Subscriber paused')
                            await this.deleteTask(this.task)
                            break;*/
                        default:
                            await this.updateTask(this.task, {status: 'error', error: serializeError(error)})
                            break;
                    }
            }
        } catch (e) {
            console.error(e)
        }
    }

    logPush = data => process.env.NODE_ENV === 'production' || (console.log(data) || this.log.push(data))
}
