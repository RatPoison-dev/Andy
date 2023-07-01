/* 
let commands = {
    commandName: {
         run: (message, args, client) => {},
         owner: true,
         originalServer: true
    }
    (or)
    commandName: (message, args, client) => {

    }
}
*/

const fs = require("fs")
const config = require("./config.json")
let commands = {}
const database = require("./database")
const embeds = require("./embeds")
const utils = require("./utils")
const {resolvePermissions} = utils

let importCommands = () => {
    let commandsDir = fs.readdirSync("commands")
    commandsDir.forEach(file => {
        let module = require("./commands/" + file)
        for (let command in module.commands) {
            commands[command] = module.commands[command]
        }
    })
}

let _runCommand = (command, ...args) => {
    return command(...args)
}

let canRunCommand = (key, message, userID) => {
    let curServer = database.fetchServer()
    let member = message.guild.members.cache.get(userID)
    let isOwner = config["owner_ids"].includes(userID)
    let ownerCheck = (key.owner == true && isOwner) || !key.owner
    let runningFromOriginalServer = message.guild.id == curServer.guild_id
    let serverCheck = (key.originalServer && runningFromOriginalServer) || !key.originalServer
    let rolesCheck = (runningFromOriginalServer && member && typeof key.roles == "object" && member.roles.cache.some(it => key.roles.includes(it.name))) || !key.roles || !member
    let channelsChack = (runningFromOriginalServer && typeof key.allowedChannels == "object" && key.allowedChannels.includes(message.channel.name)) || !key.allowedChannels
    let channelsChack2 = (runningFromOriginalServer && typeof key.blockedChannels == "object" && !key.blockedChannels.includes(message.channel.name)) || !key.blockedChannels
    let permissionsCheck = (key.permissions && member && message.member.permissions.has(resolvePermissions(key.permissions))) || !member || !key.permissions
    let disabledCheck = !key.disabled
    if (isOwner && disabledCheck) return true
    return ownerCheck && serverCheck && permissionsCheck && rolesCheck && disabledCheck && channelsChack && channelsChack2
}

let fixCommand = (command) => {
    command = command.toLowerCase()
    let commandsLowered = {}
    Object.keys(commands).forEach(h => {
        let myMan = commands[h]
        commandsLowered[h.toLowerCase()] = myMan
        if (myMan.aliases != undefined) {
            myMan.aliases.forEach(alias => {
                commandsLowered[alias.toLowerCase()] = myMan
            })
        }
    })
    let commandObject = commandsLowered[command]
    if (commandObject != undefined) return commandObject
    let doga = new utils.Dictionary(Object.keys(commandsLowered))
    let similarArr = doga.findMostSimilar(command)
    if (similarArr[1] < 0.7) return
    return commandsLowered[similarArr[0]]
}

let runCommand = async (command, message, args, client) => {
    let myServer = database.getGuildInfo(message.guild.id)
    let key = fixCommand(command)
    if (key !== undefined) {
        if (key.run !== undefined) {
            if (canRunCommand(key, message, message.author.id)) {
                try {
                    let result = await _runCommand(key.run, message, args, client)
                    let myResult
                    if (result != undefined) {
                        let myEmbedTitle = utils.attrGetter(result, "title", "")
                        myResult = utils.attrGetter(result, "result", result)
                        myResult.data?.color == undefined ? message.channel.send({embeds: [embeds.constructResultEmbed(myResult, message.author, "yellow", title = myEmbedTitle)]}) : message.channel.send({embeds: [myResult]})
                    }
                }
                catch (e) {
                    let final = utils.attrGetter(e, "stack", e.toString()).replace(config.steamWebApiKey, "[REDACTED]")
                    if (key.help != undefined) {
                        final += `\nUsage: \`\`${myServer.prefix}${command} ${key.help}\`\``
                    }
                    message.channel.send({embeds: [embeds.constructResultEmbed(final, message.author)]})
                }
            }
        }
        else {
            _runCommand(key, message, args, client)
        }
    }
}

module.exports = { importCommands, runCommand, commands, canRunCommand }