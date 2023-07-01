const utils = require("../utils")
const database = require("../database")

let commands = {
    unban: {
        "run": async (message, args, client) => {
            let user = await utils.searchUser(client, message, args)
            let username
            user == undefined ? username = "dummy" : username = user.username
            let curServer = database.fetchServer()
            let curGuild = client.guilds.cache.get(curServer.guild_id)
            let bans = await curGuild.bans.fetch()
            bans = bans.map(banInfo => banInfo.user.id)
            if (bans.includes(args[0])) {
                message.guild.members.unban(args[0])
                return "``"+ username + "``" + "was unbanned."
            }
            else {
                throw "Can't unban this user!"
            }
        },
        roles: ["Big Rats", "Ratmins"]
    }
}

module.exports = {commands}