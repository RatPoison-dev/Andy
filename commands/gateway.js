const utils = require("../utils")
const database = require("../database")
const iq_test = require("../iq_test.json")
const config = require("../config.json")
const engine = require("../engine")

let floppa = async (message, args, client, state) => {
    let foundUser = await utils.searchUser(client, message, args)
    let userID = foundUser.id
    if (!foundUser) throw "User wasn't found!"
    let ratsRole = message.guild.roles.cache.find(it => it.name == "Rats")
    let notPassedRole = message.guild.roles.cache.find(it => it.name == "gateway-not-passed")
    let member = message.guild.members.cache.find(it => it.id == userID)
    if (state == 1) {
        database.gatewayCreateRow(userID)
        database.run("update gateway set tries = ? where user_id = ?", [Number.MAX_SAFE_INTEGER, userID])
        let memberRoles = member.roles.cache
        await member.roles.remove(memberRoles)
        await member.roles.add(notPassedRole)
        message.react("✅")
    }
    else {
        database.gatewayCreateRow(userID)
        database.run("update gateway set tries = ? where user_id = ?", [0, userID])
        await member.roles.add(ratsRole)
        await member.roles.remove(notPassedRole)
        message.react("✅")    
    }
}

let commands = {
    forceWipe: {
        "run": async (message, args, client) => {
            let server = database.fetchServer()
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
            let newState = database.gatewaySwitchState()
            message.channel.send(`New gateway state: ${newState}`)
        },
        owner: true
    },
    gatewayInfo: {
        "run": async (message, args, client) => {
            let user = await utils.searchUser(client, message, args)
            if (user == undefined) {
                let gateway = database.get("select * from gateway")
                let counter = 0
                let counter1 = 0
                gateway.forEach((gatewayRow) => {
                    counter1 += 1
                    gatewayRow.tries >= config.gateway_max_tries ? counter += 1 : counter += 0
                })
                let role = message.guild.roles.cache.find(it => it.name == "gateway-not-passed")
                let members = message.guild.members.cache.filter(it => it.roles.cache.has(role.id))
                message.channel.send(`Found ${counter} not passed gateway entries.\nTotal is ${counter1} entries.\nMembers with gateway-not-passed role: ${members.size}`)
                return
            }
            let gatewayInfo = database.getGateway(user.id)
            if (gatewayInfo == undefined || gatewayInfo.answers == []) {message.channel.send("User wasn't found"); return}
            let answers = gatewayInfo.answers
            let bingus = ""
            Object.keys(iq_test).forEach((question, idx) => {
                if (answers[idx] == undefined) return
                let thisQuestion = iq_test[question]
                let correctKeys = []
                let allKeys = []
                Object.keys(thisQuestion).forEach((key, hi) => {
                    if (thisQuestion[key] == "correct") {
                        correctKeys.push((hi+1).toString())  
                    }
                    allKeys.push(`${hi+1} - ${key}`)
                })
                bingus += `Question: ${question}\nPossible answers:\n${allKeys.join("\n")}\nUser's answer: ${answers[idx]}\nCorrect: ${correctKeys.includes(answers[idx])}\n\n`
                
            })
            bingus = bingus || "No information found!"
            message.channel.send(bingus)
        },
        permissions: "ADMINISTRATOR",
        originalServer: true
    },
    punish: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser && (engine.canRunCommand(engine.commands.punish, message, foundUser.id))) throw "Access denied!"
            floppa(message, args, client, 1)
        },
        originalServer: true,
        roles: ["Admin", "Booters"],
        help: "[user] - put user in gateway"
    },
    free: {
        "run": async (message, args, client) => {
            floppa(message, args, client, 0)
        },
        originalServer: true,
        roles: ["Admin", "Booters"],
        help: "[user] - free user from gateway"
    }
}

module.exports = {commands}