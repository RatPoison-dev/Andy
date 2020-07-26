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
    if (message.author.bot) return
    let messageContent = message.content
    let info = await database.getGuildInfo(message.guild.id)
    let prefix = info.prefix
    if (messageContent.startsWith(prefix)) {
        messageContent = messageContent.substr(prefix.length, messageContent.length)
        let sub = messageContent.split(" ")
        let command = sub.shift()
        engine.runCommand(command, message, sub, client)
    }
    else if (message.mentions.members.has(client.user.id)) {
        let args = messageContent.split(" ").slice(1)
        args.slice()
        if (args.length === 0) {
            message.channel.send(`My prefix here: ${prefix}`)
        }
        else {
            engine.runCommand("monitor", message, args, client)
        }
    }
    else if (messageContent.startsWith("&")) {
        let tag = messageContent.substr("&".length, messageContent.length)
        let tagInfo = await database.getTag(message.author.id, tag)
        if (tagInfo !== undefined && tagInfo.value !== undefined) {
            message.channel.send(tagInfo.value)
        }
    }
})

client.login(config.discord_token)