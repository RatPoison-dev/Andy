const database = require("../database")

let commands = {
    help: async (message) => {
        let info = await database.getGuildInfo(message.guild.id)
        let prefix = info.prefix
        message.channel.send(`Current prefix: ${prefix}\nCommands:\nmonitor [link] - add account to bans monitor\nsetChannel [channel] - channel for bans monitor\nsetPrefix [newPrefix] - set a prefix for bot\ntags - get a help message for tags`)
    },
    // Add some shit here
    dimden: (message) => {
        message.channel.send("Bot is definitely pasted from dimden.")
    },
    invite: (message) => {
        message.channel.send("https://discord.gg/J2uHTJ2")
    },
    jdk: (message) => {
        message.channel.send("http://github.com/AdoptOpenJDK/openjdk13-binaries/releases/download/jdk-13.0.2%2B8/OpenJDK13U-jdk_x64_windows_hotspot_13.0.2_8.msi")
    }
}

module.exports = {commands}