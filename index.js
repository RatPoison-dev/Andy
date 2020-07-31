const discord = require("discord.js")
const config = require("./config.json")
const engine = require("./engine")
const database = require("./database")
engine.importCommands()
let client = new discord.Client()

const checker = require("./banChecker")
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
    let user_id = message.author.id
    // update cheese on every message
    let previous_info = await database.getUser(user_id)
    database.updateUser(user_id, "cheese", previous_info.cheese+0.001)
    
    
    if (messageContent.startsWith(prefix)) {
        messageContent = messageContent.substr(prefix.length, messageContent.length)
        let sub = messageContent.split(" ")
        let command = sub.shift()
        engine.runCommand(command, message, sub, client)
    }
    else if (message.mentions.members.has(client.user.id)) {
        let args = messageContent.split(" ").slice(1)
        if (args.length === 0) {
            message.channel.send(`My prefix here: ${prefix}`)
        }
        else {
            engine.runCommand("monitor", message, args, client)
        }
    }
})

client.login(config.discord_token)