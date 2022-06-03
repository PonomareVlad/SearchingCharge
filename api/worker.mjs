import {config} from 'dotenv'
import Queue from "../src/queue.mjs";

config({path: '../'})

export default async (req, res) => res.json(await Queue.run())
