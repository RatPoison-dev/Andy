const database = require("./database")

module.exports = [
    {
        "item_id": 0,
        "price": 1,
        "name": "Floppa",
        "display": true,
        "description": "Buy da floppa",
        "onUse": async (message, args, client) => {
            message.channel.send("https://tenor.com/view/floppa-cat-fight-floppa-ears-meme-gif-19426665")
            return true
        }
    },
    {
        "item_id": 1,
        "price": 1000,
        "name": "Ratto's pizza",
        "display": true,
        "description": "Grants access to #general2",
        "onUse": async (message, args, client) => {
            let server = await database.fetchServer()
            let guild = client.guilds.cache.get(server.guild_id)
            let role = guild.roles.cache.find(it => it.name == "gateway-access")
            let member = guild.members.cache.get(message.author.id)
            await member.roles.add(role)
            message.channel.send("Access granted!")
            return true
        }
    }
]