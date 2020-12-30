const database = require("../database")
const fetch = require("node-fetch")

let commands = {
    migrateServer: {
        "run": async (message, args, client) => {
            let server = message.guild.id
            let prevServer = await database.fetchServer()
            database.migrateActions(server, prevServer.guild_id, configsChannel.id)
            database.updateBannedChannel(server, message.guild.channels.cache.find(it => it.name == "accounts-to-watch").id)
            prevServer.banList.forEach(user => {
                message.guild.members.ban(user)
            })
            message.channel.send("Backup successfull!")
        },
        "owner": true
    },
    disableBackup: {
        "run": async (message, args, client) => {
            database.query("update server set backupProcess = false where guild_id = ?", [prevServer.guild_id])
            message.channel.send("Backup disabled")
        },
        owner: true
    }
}

module.exports = {commands}