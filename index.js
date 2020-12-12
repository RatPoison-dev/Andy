const discord = require("discord.js")
const config = require("./config.json")
const engine = require("./engine")
const database = require("./database")
const utils = require("./utils")
engine.importCommands()
let client = new discord.Client()

const checker = require("./banChecker")
let banChecker = new checker(client)

setInterval(() => banChecker.checkBans(), config.banCheckerInterval)

client.on("ready", () => {
    backupServer()
    banChecker.checkBans()
})

let backupServer = async () => {
    let curServer = await database.fetchServer()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    //backup bans
    let bans = await curGuild.fetchBans()
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
    // backup roles
    let ownage = {}
    if (curServer.backupProcess == 'false' || curServer.backupProcess == 0) {
        curGuild.roles.cache.forEach(role => {
            if (config.backupRoles.includes(role.name)) {
                ownage[role.name] = []
                role.members.forEach(user => {
                    ownage[role.name].push(user.id)
                })
            }
        })
        database.updateServer(curServer.guild_id, "roles", utils.serialize(ownage))
    }
    else {
        for (let roleName in curServer.roles) {
            let guildRole = curGuild.roles.cache.find(it => it.name == roleName)
            let members = curServer.roles[roleName]
            members.forEach(member => {
                let guildMember = curGuild.members.cache.get(member)
                if (guildMember !== undefined && guildMember.roles.cache.find(it => it.name == roleName) === undefined) {
                    guildMember.roles.add(guildRole)
                }
            })
        }
    }
}

setInterval(() => backupServer(), config.backupInterval)

client.on("guildMemberAdd", async (member) => {
    let curServer = await database.fetchServer()
    if (curServer.guild_id != member.guild.id) return
    if ((new Date().getTime() - member.user.createdTimestamp) < 86400000) {
        await member.ban({reason: "Get victored"})
    }
    else if (curServer.backupProcess) {
        for (let roleName in curServer.roles) {
            let guildRole = curGuild.roles.cache.find(it => it.name == roleName)
            let members = curServer.roles[roleName]
            if (members.includes(member.user.id)) {
                member.roles.add(guildRole)
            }
        }
    }
})

client.on("guildBanAdd", async (guild, user) => {
    let curServer = await database.fetchServer()
    let bans = await guild.fetchBans()
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
})

client.on("guildBanRemove", async (guild, user) => {
    let curServer = await database.fetchServer()
    let bans = await guild.fetchBans()
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
})

client.on("guildCreate", (guild) => {
    database.initGuild(guild.id)
})

client.on("message", async (message) => {
    if (message.author.bot) return
    let messageContent = message.content
    let info = await database.getGuildInfo(message.guild.id)
    let server = await database.fetchServer()
    let prefix = info.prefix
    let user_id = message.author.id
    // update cheese on every message
    database.incrementUser(user_id, "cheese", 0.001)
    
    
    if (messageContent.toLowerCase().startsWith(prefix.toLowerCase())) {
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

    if (message.channel.id == server.configsChannel) {
        let attachments = message.attachments.array()
        attachments = attachments.map((elem) => elem.url)
        if (attachments.length > 0) {
            database.makeSaved(message.author.id, utils.list2str(attachments), message.content)
        }
        else {
            await message.delete()
        }
    }
})

client.login(config.discord_token)