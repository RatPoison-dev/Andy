const database = require("../database")

let commands = {
    help: async (message) => {
        let info = await database.getGuildInfo(message.guild.id)
        let prefix = info.prefix
        message.channel.send(`Current prefix: ${prefix}\nCommands:\nmonitor [link] - add account to bans monitor\nsetChannel [channel] - channel for bans monitor\nsetPrefix [newPrefix] - set a prefix for bot\nprofile [?user] - get a profile\ndaily - get daily cheese and money\ntop [type] [?page]\n+rep [user] - give user some money and cheese\n-rep [user] - take some cheese from user\npay [user] [amount] - pay user\njdk - get a link to oracle openJDK\nbeta - get a link to download beta branch\ntesting - get a link to download new-testing branch\ncoin - Toss a coin\nduels [bet] [user]`)
    },
    coin: async (message, args) => {
        let rand = Math.floor(Math.random() * 2)
        if (rand == 0) {
            message.channel.send(":compass: Heads!")
        }
        else {
            message.channel.send(":compass: Tails!")
        }
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
    },
    crash: (message) => {
        message.channel.send('If you are crashing make sure you already have the newest version available on github. Then make sure your crash is not caused by settings files moved from the older version of the cheat. After checking all of that make sure to screenshot the cmd window with the error and attach the affected config in <#678938630613368843>')
    },
    beta: (message) => {
        message.channel.send("https://github.com/TheFuckingRat/RatPoison/archive/beta.zip")
    },
    testing: (message) => {
        message.channel.send("https://github.com/TheFuckingRat/RatPoison/archive/new-testing.zip")
    },
    what: (message) => {
        message.channel.send("https://cdn.discordapp.com/attachments/549942934464757770/722632593668964443/video0.mp4")
    }
}

module.exports = {commands}