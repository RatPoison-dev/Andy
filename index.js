const discord = require("discord.js")
const config = require("./config.json")
const engine = require("./engine")
const database = require("./database")
const utils = require("./utils")
const iq_test = require("./iq_test.json")
//just a bruh moment
const iAmImportant = {}
const rcMap = {}
let ignoreEvent = ""

engine.importCommands()
let client = new discord.Client()

const checker = require("./banChecker")
let banChecker = new checker(client)

client.on("ready", async () => {
    let server = await database.fetchServer()
    backupServer()
    banChecker.checkBans()
    wipeChannels()
    setInterval(() => wipeGateway(), 20000)
    setInterval(() => banChecker.checkBans(), config.banCheckerInterval)
    setInterval(() => wipeChannels(), config.wipeSleepInterval)
    setInterval(() => backupServer(), config.backupInterval)
    let curGuild = client.guilds.cache.get(server.guild_id)
    let bans = (await curGuild.fetchBans()).size
    let bannedChannel = curGuild.channels.cache.find(it => it.name.startsWith("Bans"))
    bannedChannel.setName(`Bans: ${bans}`)
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
        //curGuild.emojis.add()
        //curGuild.emojis.cache.forEach()
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
            let channel = channels.find(e => e.type == "text" && e.name == it)
            if (channel == undefined) return
            let position = channel.position
            console.log(`Should clone channel ${it}`)
            let newChannel = await channel.clone()
            await channel.delete("Wipe channels")
            newChannel.setPosition(position)
        })
        database.updateServer(server.guild_id, "wipeTimestamp", new Date().getTime())
    }
}

let wipeGateway = async () => {
    let server = await database.fetchServer()
    let guild = client.guilds.cache.get(server.guild_id)
    let gateway = guild.channels.cache.find(it => it.name == "gateway" && it.type == "text")
    let latestTimestamp = -1
    let latestMessage = undefined
    for (let key in iAmImportant) {
        let messages = iAmImportant[key]
        messages.forEach(async (it) => {
            let message = gateway.messages.cache.get(it)
            if (message == undefined) {
                iAmImportant[key] = []
                return
            }
            let timestamp = message.createdTimestamp
            if (timestamp > latestTimestamp) {
                latestTimestamp = timestamp
                latestMessage = message
            }
        })
        if (latestMessage !== undefined) {
            let member = guild.members.cache.get(key)
            let ratsRole = guild.roles.cache.find(it => it.name == "Rats")
            if (((new Date().getTime() - latestTimestamp) / 1000 > 600) && !latestMessage.deleted && member !== undefined && !member.roles.cache.has(ratsRole.id)) {
                try {
                    let member = guild.members.cache.get(key)
                    ignoreEvent = member.user.id
                    member.send("You was kicked from server due to inactivity in gateway.").catch()
                    await member.kick()
                    messages.forEach(it => {
                        let m = gateway.messages.cache.get(it)
                        let thisRc = rcMap[it]
                        if (thisRc !== undefined) {
                            thisRc.stop()
                            delete rcMap[it]
                        }
                        if (m !== undefined && !m.deleted) m.delete()
                    })
                    iAmImportant[key] = []
                }
                catch {}
            }
        }
        latestTimestamp = -1

    }
}


client.on("guildMemberRemove", async (member) => {
    let userID = member.user.id
    let server = await database.fetchServer()
    if (server.guild_id != member.guild.id) return
    let guild = client.guilds.cache.get(server.guild_id)
    guild.systemChannel.send(`**${member.user.tag}** just left the server. ||${member.id}||`)
    if (ignoreEvent == userID) {
        ignoreEvent = ""
        return
    }
    let getRes = iAmImportant[userID]
    let gateway = member.guild.channels.cache.find(it => it.name == "gateway" && it.type == "text")
    if (getRes !== undefined) {
        getRes.forEach(it => {
            let m = gateway.messages.cache.get(it)
            let thisRc = rcMap[it]
            if (thisRc !== undefined) {
                thisRc.stop()
                delete rcMap[it]
            }
            if (m !== undefined && !m.deleted) m.delete()
        })
        iAmImportant[userID] = []
    }
})

const emojiMap = {
    "1": "1️⃣",
    "2": "2️⃣",
    "3": "3️⃣",
    "4": "4️⃣",
    "5": "5️⃣"
}

let emojiToNumber = (e) => {
    let ret
    Object.values(emojiMap).forEach((it, idx) => {
        if (it == e) {
            ret = idx+1
        }
    })
    return ret
}

let gatewaySend = async (gateway, user, message) => {
    let sendedMessage = await gateway.send(message)
    if (Object.keys(iAmImportant).includes(user.id)) {
        iAmImportant[user.id].push(sendedMessage.id)
    }
    else {
        iAmImportant[user.id] = [sendedMessage.id]
    }
    return sendedMessage
}

let yeah = async (currentIndex, gateway, member) => {
    let user = member.user
    let userID = user.id
    let currentMessage = Object.keys(iq_test).find((_, idx) => idx == currentIndex)
    let values = iq_test[currentMessage]
    let correctKeys = []
    let allKeys = []
    let finalMessage = `${currentMessage}\n`
    Object.keys(values).forEach((it, idx) => {
        if (values[it] == "correct") {
            correctKeys.push(emojiMap[idx + 1])
        }
        allKeys.push(emojiMap[idx + 1])
        finalMessage += `${idx + 1} - ${it}\n`
    })
    let sended = await gatewaySend(gateway, user, finalMessage)
    let rc = new discord.ReactionCollector(sended, (r, u) => u.id == userID)
    let ratsRole = member.guild.roles.cache.find(it => it.name == "Rats")
    rcMap[sended.id] = rc
    allKeys.forEach(it => sended.react(it).catch(rejected => {
        console.log("Await reactions failed!")
        member.roles.add(ratsRole)
    }))
    rc.on("collect", async (r, u) => {
        rc.stop()
        delete rcMap[sended.id]
        let userGateway = await database.getGateway(userID)
        let answer = emojiToNumber(r.emoji.name)
        userGateway.answers.push(answer)
        database.run("update gateway set answers = ? where user_id = ?", [utils.list2str2(userGateway.answers), userID])
        if (!correctKeys.includes(r.emoji.name)) {
            if (userGateway.tries + 1 >= config["gateway_max_tries"]) {
                let notPassedRole = member.guild.roles.cache.find(it => it.name == "gateway-not-passed")
                await member.roles.add(notPassedRole)
                let b = iAmImportant[userID]
                b.forEach(message => {
                    let m = gateway.messages.cache.get(message)
                    if (m !== undefined && !m.deleted) m.delete()
                })
                database.increaseGatewayTries(userID)
                //database.deleteGatewayInfo(userID)
                iAmImportant[userID] = []
                return
            }
            if (userGateway.tries + 2 >= config["gateway_max_tries"]) {
                await gatewaySend(gateway, user, `${member.toString()} You failed the test. You have last try to pass it.`)
            }
            else {
                await gatewaySend(gateway, user, `${member.toString()} You failed the test.`)
            }
            database.increaseGatewayTries(userID)
            database.run("update gateway set answers = ? where user_id = ?", [utils.list2str2([]), userID])
            yeah(0, gateway, member)
        }
        else {
            if (currentIndex != Object.keys(iq_test).length-1) {
                yeah(currentIndex + 1, gateway, member)
            }
            else {
                await member.roles.add(ratsRole)
                let b = iAmImportant[userID]
                b.forEach(async message => { 
                    gateway.messages.cache.get(message).delete()
                })
                iAmImportant[userID] = []
            }
        }
    })
}

client.on("guildMemberAdd", async (member) => {
    let curServer = await database.fetchServer()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    let user = member.user
    let userID = user.id
    if (curServer.guild_id != member.guild.id) return
    if (((new Date().getTime() - user.createdTimestamp) / 1000 < 86400) && !user.bot) {
        await member.ban({reason: "Get victored"})
    }
    else {
        database.gatewayCreateRow(userID)
        let gateway = member.guild.channels.cache.find(it => it.name == "gateway" && it.type == "text")
        let ratsRole = member.guild.roles.cache.find(it => it.name == "Rats")
        let notPassedRole = member.guild.roles.cache.find(it => it.name == "gateway-not-passed")
        let userGateway = await database.getGateway(userID) 
        if (userGateway.tries >= config.gateway_max_tries) {
            await member.roles.add(notPassedRole)
            return
        }
        if (curServer.gateway == 0) {
            await member.roles.add(ratsRole)
            return
        }
        else {
            await gatewaySend(gateway, user, `Hi, ${member.toString()}.\nPass a small IQ test before you can enter.`)
            try {
                yeah(0, gateway, member)
            }
            catch (e) {
                console.error(e)
                console.log("Test failed!")
                await member.roles.add(ratsRole)
            }
        }
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
    let curServer = await database.fetchServer()
    if (curServer.guild_id != guild.id) return
    let realBans = await guild.fetchBans()
    let bans = await guild.fetchBans()
    let curGuild = client.guilds.cache.get(curServer.guild_id)
    curGuild.systemChannel.send(`**${user.tag}** Get jojoed. ||${user.id}||`)
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
    let logsChannel = guild.channels.cache.find(it => it.name.startsWith("logs"))
    let thisBan = realBans.find(pov => pov.user.id == user.id)
    if (thisBan.reason == null) thisBan.reason = "Unspecified."
    logsChannel.send(`\`\`${user.tag}\`\` was banned with reason \`\`${thisBan.reason}\`\``)
    let bannedChannel = guild.channels.cache.find(it => it.name.startsWith("Bans"))
    await bannedChannel.setName(`Bans: ${bans.length}`)
})

client.on("guildBanRemove", async (guild, user) => {
    let curServer = await database.fetchServer()
    if (curServer.guild_id != guild.id) return
    let bans = await guild.fetchBans()
    bans = bans.map(banInfo => banInfo.user.id)
    database.updateServer(curServer.guild_id, "banList", utils.serialize(bans))
    let bannedChannel = guild.channels.cache.find(it => it.name.startsWith("Bans"))
    await bannedChannel.setName(`Bans: ${bans.length}`)
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
    if (server.guild_id == message.guild.id) database.incrementUser(user_id, "cheese", 0.001)
    
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
    //    let attachments = message.attachments.array()
    //    attachments = attachments.map((elem) => elem.url)
    //    if (attachments.length > 0) {
    //        database.makeSaved(message.author.id, utils.list2str(attachments), message.content)
    //    }
    //    else {
    //        let roles = message.guild.members.cache.get(message.author.id).roles.cache.array().map(it => it.name)
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
        let attachments = message.attachments.array()
        urls = attachments.map((elem) => elem.url)
        urls.forEach(async it => {
            if (it.endsWith(".dll") || it.endsWith(".exe")) {
                let shouldDelete = true
                let roles = message.guild.members.cache.get(message.author.id).roles.cache.array().map(it => it.name)
                config.backupRoles.forEach(it => {
                    if (roles.includes(it)) {
                        shouldDelete = false
                    }
                }) 
                if (shouldDelete) message.delete()
            }
        }) 
    }
})

client.login(config.discord_token)