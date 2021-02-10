const database = require("./database")
const config = require("./config.json")

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
    },
    {
        "item_id": 2,
        "price": 5000,
        "name": "Big Chungus",
        "display": true,
        "description": "Get out of gateway",
        "onUse": async (message) => {
            let user = message.author
            let userID = user.id
            let gatewayInfo = await database.getGateway(userID)
            if (gatewayInfo == undefined || gatewayInfo.tries < config.gateway_max_tries) {
                message.channel.send("You are not in gateway.")
                return false
            }
            else {
                let ratsRole = message.guild.roles.cache.find(it => it.name == "Rats")
                let notPassedRole = message.guild.roles.cache.find(it => it.name == "gateway-not-passed")
                let member = message.guild.members.cache.find(it => it.id == userID)
                database.gatewayCreateRow(userID)
                database.run("update gateway set tries = 0 where user_id = ?", [userID])
                await member.roles.add(ratsRole)
                await member.roles.remove(notPassedRole)
                return true
            }
        }
    }
]