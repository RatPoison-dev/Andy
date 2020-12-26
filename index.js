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
    wipeChannels()
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

let wipeChannels = async () => {
    let server = await database.fetchServer()
    if ((new Date().getTime() - server.wipeTimestamp) / 1000 > 259200) {
        let guild = client.guilds.cache.get(server.guild_id)
        config.wipe_channels.forEach( async it => {
            let channels = guild.channels.cache
            channels.forEach( async channel => {
                if (channel.type == "text" && channel.name == it) {
                    let position = channel.position
                    let newChannel = await channel.clone()
                    await channel.delete()
                    newChannel.setPosition(position)
                    database.updateServer(server.guild_id, "wipeTimestamp", new Date().getTime())
                }
            })
        })
    }
}


client.on("guildMemberRemove", async (member) => {
    let server = await database.fetchServer()
    if (server.guild_id != member.guild.id) return
    let guild = client.guilds.cache.get(server.guild_id)
    guild.systemChannel.send(`**${member.user.tag}** just left the server. ||${member.id}||`)
})

setInterval(() => wipeChannels(), config.wipeSleepInterval)

setInterval(() => backupServer(), config.backupInterval)

client.on("guildMemberAdd", async (member) => {
    let curServer = await database.fetchServer()
    if (curServer.guild_id != member.guild.id) return
    if (((new Date().getTime() - member.user.createdTimestamp) / 1000 < 86400) && !member.user.bot) {
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
    await member.roles.add("785836086815227935")
})

client.on("guildBanAdd", async (guild, user) => {
    let curServer = await database.fetchServer()
    if (curServer.guild_id != guild.id) return
    let bans = await guild.fetchBans()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    curGuild.systemChannel.send(`**${user.tag}** Get jojoed. ||${user.id}||`)
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
            let roles = message.guild.members.cache.get(message.author.id).roles.cache.array().map(it => it.name)
            let shouldDelete = true
            config.backupRoles.forEach(it => {
                if (roles.includes(it)) {
                    shouldDelete = false
                }
            }) 
            if (shouldDelete) await message.delete()
        }
    }
    if (server.guild_id == message.guild.id) {
        let attachments = message.attachments.array()
        attachments = attachments.map((elem) => elem.url)
        attachments.forEach(async it => {
            if (it.endsWith(".dll") || it.endsWith(".exe")) {
                let shouldDelete = true
                let roles = message.guild.members.cache.get(message.author.id).roles.cache.array().map(it => it.name)
                config.backupRoles.forEach(it => {
                    if (roles.includes(it)) {
                        shouldDelete = false
                    }
                }) 
                if (shouldDelete) await message.delete()
            }
        }) 
    }
})

client.login(config.discord_token)