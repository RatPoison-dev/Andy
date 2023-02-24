const discord = require("discord.js")
const config = require("./config.json")
const engine = require("./engine")
const database = require("./database")
const utils = require("./utils")
const cron = require("cron")
//just a bruh moment
let ignoreEvent = ""

engine.importCommands()
let client = new discord.Client(config.clientOptions)

const checker = require("./banChecker")
let banChecker = new checker(client)

const job = new cron.CronJob("00 00 00 * * *", async () => {
    let server = await database.fetchServer()
    let myGuild = client.guilds.cache.get(server.guild_id)
    let myMembers = myGuild.members.cache.filter(it => it.roles.cache.some(it => it.name == "Cute Rats" || it.name == "Donators"))
    myMembers.forEach(it => {
        database.incrementUser(it.user.id, "cheese", 0.05, "Daily cheese claim (donator | booster)")
    })
})


client.on("ready", async () => {
    console.log(`[Andy] Logged in as: ${client.user.tag}`)
    let server = database.fetchServer()
    //let guildToDump = client.guilds.cache.get("813001976278941707")
    //let guildToSteal = client.guilds.cache.get("785830829439320095")
    //guildToSteal.emojis.cache.forEach( async (emoji) => {
    //    if (!guildToDump.emojis.cache.some(it => it.name == emoji.name)) {
    //        await guildToDump.emojis.create(emoji.url, emoji.name)
    //    }
    //})

    job.start()
    backupServer()
    banChecker.checkBans()
    wipeChannels()
    setInterval(() => banChecker.checkBans(), config.banCheckerInterval)
    setInterval(() => wipeChannels(), config.wipeSleepInterval)
    setInterval(() => backupServer(), config.backupInterval)
    let curGuild = client.guilds.cache.get(server.guild_id)
    let bans = (await curGuild.bans.fetch()).size
    let bannedChannel = curGuild.channels.cache.find(it => it.name.startsWith("Bans"))
    bannedChannel.setName(`Bans: ${bans}`)
    for (let guild of client.guilds.cache.values()) {
        await guild.members.fetch({cache:true})
    }
})

let backupServer = async () => {
    let curServer = database.fetchServer()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    //backup bans
    let bans = await curGuild.bans.fetch()
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
    // backup roles
    let rolesMap = {}
    let emojiMap = {}
    if (curServer.backupProcess == 'false' || curServer.backupProcess == 0) {
        curGuild.roles.cache.forEach(role => {
            if (config.backupRoles.includes(role.name)) {
                rolesMap[role.name] = []
                role.members.forEach(user => {
                    rolesMap[role.name].push(user.id)
                })
            }
        })
        curGuild.emojis.cache.forEach(it => {
            emojiMap[it.name] = it.url
        })
        database.updateServer(curServer.guild_id, ["roles", "emojis"], [utils.serialize(rolesMap), utils.serialize(emojiMap)])
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

let wipeChannel = async (currentIndex, wipeChannels, guildChannels) => {
    if (currentIndex > (wipeChannels.length - 1)) return
    let currentChannel = wipeChannels[currentIndex]
    let myChannel = guildChannels.find(e => e.type == "text" && e.name == currentChannel)
    if (myChannel) {
        let position = myChannel.position
        let newChannel = await myChannel.clone()
        await myChannel.delete("Wipe channels")
        newChannel.setPosition(position)
    }
    wipeChannel(currentIndex + 1, wipeChannels, guildChannels)
}

client.on("wipeChannels", () => {
    let myServers = Object.keys(config.wipe_channels)
    myServers.forEach(myServer => {
        let myGuild = client.guilds.cache.find(it => it.name.toLowerCase().startsWith(myServer))
        if (!myGuild) return
        let channels = myGuild.channels.cache
        wipeChannel(0, config.wipe_channels[myServer], channels)
    })
})

let wipeChannels = async () => {
    let server = database.fetchServer()
    if ((new Date().getTime() - server.wipeTimestamp) / 1000 > 259200) {
        client.emit("wipeChannels")
        database.updateServer(server.guild_id, "wipeTimestamp", new Date().getTime())
    }
}



client.on("guildMemberRemove", async (member) => {
    let userID = member.user.id
    let server = database.fetchServer()
    if (!Object.keys(config.wipe_channels).some(it => member.guild.name.toLowerCase().startsWith(it))) return
    let guild = client.guilds.cache.get(member.guild.id)
    await guild.systemChannel.send(`**${member.user.tag}** just left the server. ||${member.id}||`)
    if (server.guild_id != member.guild.id) return
    if (ignoreEvent == userID) {
        ignoreEvent = ""
        return
    }
})

client.on("guildMemberAdd", async (member) => {
    let curServer = database.fetchServer()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    let user = member.user
    let userID = user.id
    if (curServer.guild_id != member.guild.id) return
    if (((new Date().getTime() - user.createdTimestamp) / 1000 < 86400) && !user.bot && curServer.antiRade) {
        await member.ban({ reason: "Get victored" })
    }

    if (curServer.backupProcess) {
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
    let curServer = database.fetchServer()
    if (curServer.guild_id != guild.id) return
    let realBans = await guild.bans.fetch()
    let bans = await guild.bans.fetch()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    curGuild.systemChannel.send(`**${user.tag}** Get jojoed. ||${user.id}||`)
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
    let logsChannel = guild.channels.cache.find(it => it.name.startsWith("logs"))
    let thisBan = realBans.find(pov => pov.user.id == user.id)
    if (thisBan.reason == null) thisBan.reason = "Unspecified."
    logsChannel.send(`\`\`${user.tag}\`\` was banned with reason \`\`${thisBan.reason}\`\``)
    let ban = (await guild.fetchAuditLogs()).entries.filter(e => e.action === 'MEMBER_BAN_ADD').sort((a, b) => b.createdAt - a.createdAt).first()
    let rat = curGuild.members.cache.get("186349391299346433")
    rat.send("``" + user.tag + "`` was banned with reason" + " ``" + thisBan.reason + "`` by ``" + ban.executor.tag + "``")
    let bannedChannel = guild.channels.cache.find(it => it.name.startsWith("Bans"))
    await bannedChannel.setName(`Bans: ${bans.length}`)
})

client.on("guildBanRemove", async (guild, user) => {
    let curServer = database.fetchServer()
    if (curServer.guild_id != guild.id) return
    let bans = await guild.bans.fetch()
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
    let bannedChannel = guild.channels.cache.find(it => it.name.startsWith("Bans"))
    await bannedChannel.setName(`Bans: ${bans.length}`)
})

client.on("guildCreate", (guild) => {
    database.initGuild(guild.id)
})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    let messageContent = message.content
    if (message.channel.type == "dm") return
    let info = database.getGuildInfo(message.guild.id)
    let server = database.fetchServer()
    let prefix = info.prefix
    let user_id = message.author.id
    // update cheese on every message
    if (server.guild_id == message.guild.id) database.incrementUser(user_id, "cheese", 0.001, "Syscall", log = false)

    let tmp = messageContent.toLowerCase().split(" ")
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
    else if (server.guild_id == message.guild.id && (tmp[0] == "+rep" || tmp[0] == "-rep")) {
        engine.runCommand(tmp[0], message, tmp.slice(1), client)
    }

    //if (message.channel.id == server.configsChannel) {
    //    let attachments = Array.from(message.attachments.array())
    //    attachments = attachments.map((elem) => elem.url)
    //    if (attachments.length > 0) {
    //        database.makeSaved(message.author.id, utils.list2str(attachments), message.content)
    //    }
    //    else {
    //        let roles = Array.from(message.guild.members.cache.get(message.author.id).roles.cache.array()).map(it => it.name)
    //        let shouldDelete = true
    //        config.backupRoles.forEach(it => {
    //            if (roles.includes(it)) {
    //                shouldDelete = false
    //            }
    //        }) 
    //        if (shouldDelete) message.delete()
    //    }
    //}
    if (server.guild_id == message.guild.id) {
        if (config.stickers_att.some(it => message.content.includes(it))) { message.delete(); return }
        let attachments = Array.from(message.attachments.values())
        if (message.channel.name == "announcements") {
            let honcho = message.guild.roles.cache.find(it => it.name == 'Rat Honcho')
            let bigRat = message.guild.roles.cache.find(it => it.name == 'Big Rats')
            let member = message.guild.members.cache.get(user_id)
            if (!(member.roles.cache.has(bigRat.id) || member.roles.cache.has(honcho.id))) {
                message.delete()
                return
            }
        }
        urls = attachments.map((elem) => elem.url)
        urls.forEach(async it => {
            if (it.endsWith(".dll") || it.endsWith(".exe")) {
                let shouldDelete = true
                let roles = Array.from(message.guild.members.cache.get(message.author.id).roles.cache.values()).map(it => it.name)
                config.backupRoles.forEach(it => {
                    if (roles.includes(it)) {
                        shouldDelete = false
                    }
                })
                if (config.stickers_att.includes(it)) shouldDelete = true
                if (shouldDelete) message.delete()
            }
        })
    }
})

client.login(config.discord_token)