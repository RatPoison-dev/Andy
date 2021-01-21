const utils = require("../utils")
const database = require("../database")
const iq_test = require("../iq_test.json")

let floppa = async (message, args, client, state) => {
    let foundUser = await utils.searchUser(client, message, args)
    let userID = foundUser.id
    if (foundUser == undefined) {
        message.channel.send("User not found!")
        return
    }
    let ratsRole = message.guild.roles.cache.find(it => it.name == "Rats")
    let notPassedRole = message.guild.roles.cache.find(it => it.name == "gateway-not-passed")
    let curServer = await database.fetchServer()
    let member = message.guild.members.cache.find(it => it.id == userID)
    if (state == 1) {
        curServer["gatewayNotPassed"].push(userID)
        database.updateServer(curServer.guild_id, "gatewayNotPassed", utils.list2str2(curServer["gatewayNotPassed"]))
        await member.roles.add(notPassedRole)
        await member.roles.remove(ratsRole)
        message.react("✅")
    }
    else {
        let curIdx = curServer["gatewayNotPassed"].findIndex(it => it == userID)
        if (curIdx !== -1) {
            delete curServer["gatewayNotPassed"][curIdx]
            database.updateServer(curServer.guild_id, "gatewayNotPassed", utils.list2str2(curServer["gatewayNotPassed"]))
            await member.roles.add(ratsRole)
            await member.roles.remove(notPassedRole)
            message.react("✅")    
        }
    }
}

let commands = {
    forceWipe: {
        "run": async (message, args, client) => {
            let server = await database.fetchServer()
            let guild = client.guilds.cache.get(server.guild_id)

            config.wipe_channels.forEach( async it => {
                let channels = guild.channels.cache
                channels.forEach( async channel => {
                    if (channel.type == "text" && channel.name == it) {
                        let position = channel.position
                        let newChannel = await channel.clone()
                        await channel.delete()
                        newChannel.setPosition(position)
                    }
                })
            })
            database.updateServer(server.guild_id, "wipeTimestamp", new Date().getTime())
        },
        owner: true
    },
    gateway: {
        "run": async (message, args) => {
            let newState = await database.gatewaySwitchState()
            message.channel.send(`New gateway state: ${newState}`)
        },
        owner: true
    },
    gatewayInfo: {
        "run": async (message, args, client) => {
            let user = await utils.searchUser(client, message, args)
            if (user == undefined) {message.channel.send("User wasn't found"); return}
            let gatewayInfo = await database.getGateway(user.id)
            if (gatewayInfo == undefined || gatewayInfo.answers == []) {message.channel.send("User wasn't found"); return}
            let answers = gatewayInfo.answers
            let bingus = ""
            Object.keys(iq_test).forEach((question, idx) => {
                if (answers[idx] == undefined) return
                let thisQuestion = iq_test[question]
                let correctKeys = []
                Object.keys(thisQuestion).forEach((key, hi) => {
                    if (thisQuestion[key] == "correct") {
                        correctKeys.push((hi+1).toString())
                    }
                })
                bingus += `Question: ${question}\nUser's answer: ${answers[idx]}\nCorrect: ${correctKeys.includes(answers[idx])}\n\n`
                
            })
            message.channel.send(bingus)
        },
        permissions: "ADMINISTRATOR",
        originalServer: true
    },
    punish: {
        "run": async (message, args, client) => {
            floppa(message, args, client, 1)
        },
        originalServer: true,
        permissions: "MANAGE_ROLES",
        help: "[user] - put user in gateway"
    },
    free: {
        "run": async (message, args, client) => {
            floppa(message, args, client, 0)
        },
        originalServer: true,
        permissions: "MANAGE_ROLES",
        help: "[user] - free user from gateway"
    }
}

module.exports = {commands}