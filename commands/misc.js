const database = require("../database")
const engine = require("../engine")


let commands = {
    help: async (message) => {
        await message.react("✅")
        let info = await database.getGuildInfo(message.guild.id)
        let prefix = info.prefix
        let commands = engine.commands
        let s = `Current prefix: ${prefix}\n`
        for (let command in commands) {
            if (commands[command].help !== undefined) {
                s += `${command} ${commands[command].help}\n`
            }
        }
        message.author.send(s)
    },
    coin: { 
        "run": async (message, args) => {
            let rand = Math.floor(Math.random() * 2)
            if (rand == 0) {
                message.channel.send(":compass: Heads!")
            }
            else {
                message.channel.send(":compass: Tails!")
            }
        },
        "help": "- Toss a coin"
    },
    // Add some shit here
    dimden: (message) => {
        message.channel.send("Bot is definitely pasted from dimden.")
    },
    invite: (message) => {
        message.channel.send("https://discord.gg/xkTteTM")
    },
    jdk: (message) => {
        message.channel.send("https://www.oracle.com/java/technologies/javase-jdk14-downloads.html")
    },
    crash: (message) => {
        message.channel.send('If you are crashing make sure you already have the newest version available on github. Then make sure your crash is not caused by settings files moved from the older version of the cheat. After checking all of that make sure to screenshot the cmd window with the error and attach the affected config in <#741018234274185216>')
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