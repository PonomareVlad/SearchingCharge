import mongo from '../src/db.mjs'

const users = mongo.db('Telegram').collection('Users')

export default async (req, res) => {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=Users.csv')
    const usersList = await users.find().toArray()
    const header = ['ID', 'Логин', 'Имя', 'Фамилия', 'Финалист']
    return res.send([header, ...usersList.map(renderUserData)].join('\r\n'))
}

const renderUserData = ({id, username, first_name, last_name, final} = {}) =>
    [id || '', username ? `https://t.me/${username}` : '', first_name ? `"${first_name}"` : '', last_name ? `"${last_name}"` : '', final ? 'Да' : 'Нет']
