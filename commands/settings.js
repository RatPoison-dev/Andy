const database = require("../database")

let commands = {
    setChannel: (message) => {
        if (message.member.permissions.has("ADMINISTRATOR")) {
            let channel = message.mentions.channels.first()
            if (channel !== undefined) {
                database.updateBannedChannel(message.guild.id, channel.id)
                message.channel.send("Channel was updated.")
            }
            else {
                message.channel.send("You need to specify channel.")
            }
        }
    },
    setPrefix: (message, args) => {
        if (message.member.permissions.has("ADMINISTRATOR")) {
            if (args.length > 0) {
                database.updatePrefix(message.guild.id, args[0])
                message.channel.send("Prefix was updated.")
            }
            else {
                message.channel.send("You need to specify new prefix.")
            }
        }
    }
}

module.exports = {commands}