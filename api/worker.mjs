import {config} from 'dotenv'
import Queue from "../src/queue.mjs";

config()

export default async (req, res) => {
    const result = await Queue.run()
    return res.json ? res.json(result) : result
}
