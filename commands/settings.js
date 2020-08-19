const database = require("../database")

let commands = {
    setChannel:  {
        "run": (message) => {
            let channel = message.mentions.channels.first()
            if (channel !== undefined) {
                database.updateBannedChannel(message.guild.id, channel.id)
                message.channel.send("Channel was updated.")
            }
            else {
                message.channel.send("You need to specify channel.")
            }
        },
        help: "[channel] - channel for bans monitor",
        permissions: "ADMINISTRATOR"
    },
    setPrefix: {
        "run": (message, args) => {
            if (args.length > 0) {
                database.updatePrefix(message.guild.id, args[0])
                message.channel.send("Prefix was updated.")
            }
            else {
                message.channel.send("You need to specify new prefix.")
            }
        },
        help: "[newPrefix] - set a prefix for bot",
        permissions: "ADMINISTRATOR"
    }
}

module.exports = {commands}