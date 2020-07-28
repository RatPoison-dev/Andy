const database = require("../database")

let commands = {
    help: async (message) => {
        let info = await database.getGuildInfo(message.guild.id)
        let prefix = info.prefix
        message.channel.send(`Current prefix: ${prefix}\nCommands:\nmonitor [link] - add account to bans monitor\nsetChannel [channel] - channel for bans monitor\nsetPrefix [newPrefix] - set a prefix for bot\nprofile [?user] - get a profile\ndaily - get daily cheese and money\ntop [type] [?page]\n+rep [user] - give user some money and cheese\n-rep [user] - take some cheese from user\npay [user] [amount] - pay user`)
    },
    // Add some shit here
    dimden: (message) => {
        message.channel.send("Bot is definitely pasted from dimden.")
    },
    invite: (message) => {
        message.channel.send("https://discord.gg/J2uHTJ2")
    },
    jdk: (message) => {
        message.channel.send("https://www.oracle.com/java/technologies/javase-jdk14-downloads.html")
    }
}

module.exports = {commands}