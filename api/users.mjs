import mongo from '../src/db.mjs'

const users = mongo.db('Telegram').collection('Users')

export default async (req, {send}) => {
    const usersList = await users.find().toArray()
    const header = ['ID', 'Логин', 'Имя', 'Фамилия', 'Финалист']
    return send([header, ...usersList.map(renderUserData)].join('\r\n'))
}

const renderUserData = ({id, username, first_name, last_name, final} = {}) =>
    [id || '', username ? `https://t.me/${username}` : '', first_name ? `"${first_name}"` : '', last_name ? `"${last_name}"` : '', final ? 'Да' : 'Нет']
