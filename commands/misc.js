const database = require("../database")

let commands = {
    help: async (message) => {
        let info = await database.getGuildInfo(message.guild.id)
        let prefix = info.prefix
        message.channel.send(`Current prefix: ${prefix}\nCommands:\nmonitor [link] - add account to bans monitor\nsetChannel [channel] - channel for bans monitor\nsetPrefix [newPrefix] - set a prefix for bot\ntags - get a help message for tags`)
    }
}

module.exports = {commands}