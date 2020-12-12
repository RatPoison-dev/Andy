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
        message.channel.send("https://dimden.dev/ratpoisonowns")
    },
    jdk: (message) => {
        message.channel.send("https://www.oracle.com/java/technologies/javase-jdk14-downloads.html")
    },
    master: (message) => {
        message.channel.send("https://github.com/TheRatCode/RatPoison/archive/master.zip")
    },
    beta: (message) => {
        message.channel.send("https://github.com/TheRatCode/RatPoison/archive/beta.zip")
    },
    release: (message) => {
        message.channel.send("https://github.com/TheRatCode/RatPoison/releases/download/1.7.1/RatPoison-1.7.1.zip")
    },
    //crash: (message) => {
    //    message.channel.send(`Stop right there criminal scum! :raised_hand::oncoming_police_car: \nYour RatPoison is crashing and you are **too retarded** to search for the answer?\nWell, you have to **redownload** it from the GitHub.\nNew-testing: https://github.com/TheFuckingRat/RatPoison/archive/new-testing.zip\nThat's it, **RETARD** :japanese_goblin:`)
    //},
    what: (message) => {
        message.channel.send("https://cdn.discordapp.com/attachments/549942934464757770/722632593668964443/video0.mp4")
    },
    faceit: (message) => {
        message.channel.send("RatPoison will work without any problems if you don't have FaceIT AntiCheat open.\nWith FaceIT AntiCheat RatPoison will be stuck at Launching..., nothing can be done to prevent that.")
    },
    ratto: (message) => {
        message.channel.send("dude RATTO do u have Masochism or sth ?!")
    },
    status: (message) => {
        message.channel.send("Current status:\nmaster: **undetected**\nbeta: **latest**")
    },
    launching: (message) => {
        message.channel.send("You are stuck at Launching...?\nMake sure you have checked all of those steps:\n- you are running currently most up-to-date version of RatPoison\n- you disabled all anti-cheat clients working on your computer\n- your RatPoison folder is placed somewhere with all running permissions\n- you don't use RatPoison with some other cheats running\n- you aren't currently running VAC bypass (running the bat file with administrator privileges should work)\n- you restarted your computer\n\nIf nothing else works then you can try running the bat file as admin.")
    }
}

module.exports = {commands}