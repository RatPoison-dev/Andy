let discord = require("discord.js")
let config = require("./config.json")
let engine = require("./engine")
let database = require("./database")
engine.importCommands()
let client = new discord.Client()

let checker = require("./banChecker")
let banChecker = new checker(client)

setInterval(() => banChecker.checkBans(), config.banCheckerInterval)

client.on("ready", () => banChecker.checkBans())

client.on("guildCreate", (guild) => {
    database.initGuild(guild.id)
})

client.on("message", async (message) => {
    message
    let messageContent = message.content
    let info = await database.getGuildInfo(message.guild.id)
    let prefix = info.prefix
    if (messageContent.startsWith(prefix)) {
        messageContent = messageContent.substr(prefix.length, messageContent.length)
        let sub = messageContent.split(" ")
        let command = sub.shift()
        engine.runCommand(message.author.id, command, message, sub, client)
    }
    else if (engine.checkAfters(message.author.id)) {
        engine.runCommand(message.author.id, "", message, "", client)
    }
})

client.login(config.discord_token)