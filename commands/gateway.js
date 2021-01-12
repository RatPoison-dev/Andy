const utils = require("../utils")
const database = require("../database")

let floppa = async (message, args, client, state) => {
    let foundUser = utils.searchUser(client, message, args)
    if (foundUser == undefined) return
    let ratsRole = message.guild.roles.cache.find(it => it.name == "Rats")
    let notPassedRole = message.guild.roles.cache.find(it => it.name == "gateway-not-passed")
    let curServer = await database.fetchServer()
    if (state == 1) {
        curServer["gatewayNotPassed"].push(foundUser.id)
        database.updateServer(curServer.guild_id, "gatewayNotPassed", utils.list2str2(curServer["gatewayNotPassed"]))
        await foundUser.roles.add(notPassedRole)
        await foundUser.roles.remove(ratsRole)
        message.react("✅")
    }
    else {
        let curIdx = curServer["gatewayNotPassed"].findIndex(it => it == foundUser.id)
        if (curIdx !== -1) {
            delete curServer["gatewayNotPassed"]
            database.updateServer(curServer.guild_id, "gatewayNotPassed", utils.list2str2(curServer["gatewayNotPassed"]))
            await foundUser.roles.add(ratsRole)
            await foundUser.roles.remove(notPassedRole)
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
    punish: {
        "run": async (message, args, client) => {
            floppa(message, args, client, 1)
        },
        originalServer: true,
        permissions: "MANAGE_ROLES"
    },
    free: {
        "run": async (message, args, client) => {
            floppa(message, args, client, 0)
        },
        originalServer: true,
        permissions: "MANAGE_ROLES"
    }
}

module.exports = {commands}