import mongo from '../src/db.mjs'

export default class Queue {
    static tasks = mongo.db("telegram").collection("tasks")

    static run() {
        return new this().run()
    }

    async run() {
        return {status: true}
    }
}
