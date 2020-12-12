const database = require("../database")
const fetch = require("node-fetch")

let commands = {
    migrateServer: {
        "run": async (message, args, client) => {
            let server = message.guild.id
            let prevServer = await database.fetchServer()
            let configsChannel = message.guild.channels.cache.find(it => it.name == "configs")
            database.migrateActions(server, prevServer.guild_id, configsChannel.id)
            database.updateBannedChannel(server, message.guild.channels.cache.find(it => it.name == "accounts-to-watch").id)
            let messages = await database.getSaved()
            messages.forEach((row) => {
                let id
                let user = client.users.cache.get(row.user_id)
                if (user !== undefined) {
                    id = user.tag
                }
                else {
                    id = row.user_id
                }
                configsChannel.send(`Message from user: ${id}\nMessage content: ${row.message_content}\n${row.attachments.replace(",", "\n")}`)
            })
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
        }
    }
}

module.exports = {commands}