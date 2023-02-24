const database = require("../database")
const fetch = require("node-fetch")

let commands = {
    migrateServer: {
        "run": async (message, args, client) => {
            let server = message.guild.id
            let prevServer = database.fetchServer()
            database.migrateActions(server, prevServer.guild_id, configsChannel.id)
            database.updateGuild(server, "bannedChannel", message.guild.channels.cache.find(it => it.name == "accounts-to-watch").id)
            prevServer.banList.forEach(user => {
                message.guild.members.ban(user)
            })
            Promise.all(Object.keys(prevServer.emojis).map(it => message.guild.emojis.create(prevServer.emojis[it], it))).catch(console.error)
            return "Recovering process started. Use rat!disableBackup to disable it."
        },
        "owner": true
    },
    disableBackup: {
        "run": async (message, args, client) => {
            database.run("update server set backupProcess = 0 where guild_id = ?", [prevServer.guild_id])
            message.channel.send("Backup was disabled")
        },
        owner: true
    }
}

module.exports = {commands}