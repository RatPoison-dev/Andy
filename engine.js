// let commands = {
//     command: (message, args) => {
//         run: () => {},
//         owner: true,
//         originalServer: true
//     }
// }

const fs = require("fs")
const config = require("./config.json")
let commands = {}
const database = require("./database")
const embeds = require("./embeds")
const utils = require("./utils")

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

let canRunCommand = (key, message, curServer) => {
    let userID = message.author.id
    let member = message.guild.members.cache.get(userID)
    let isOwner = config["owner_ids"].includes(userID)
    let ownerCheck = (key.owner == true && isOwner) || !key.owner
    let runningFromOriginalServer = message.guild.id == curServer.guild_id
    let serverCheck = (key.originalServer && runningFromOriginalServer) || !key.originalServer
    let rolesCheck = (runningFromOriginalServer && typeof key.roles == "object" && member.roles.cache.some(it => key.roles.includes(it.name))) || !key.roles
    let permissionsCheck = message.member.permissions.has(key.permissions)
    let disabledCheck = !key.disabled
    if (isOwner) return true
    return ownerCheck && serverCheck && permissionsCheck && disabledCheck && rolesCheck
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
    let curServer = await database.fetchServer()
    let myServer = await database.getGuildInfo(message.guild.id)
    let key = fixCommand(command)
    if (key !== undefined) {
        if (key.run !== undefined) {
            if (canRunCommand(key, message, curServer)) {
                try {
                    let result = await _runCommand(key.run, message, args, client)
                    let myResult
                    if (result != undefined) {
                        let myEmbedTitle = utils.attrGetter(result, "title", "")
                        myResult = utils.attrGetter(result, "result", result)
                        myResult.color == undefined ? message.channel.send(embeds.constructResultEmbed(myResult, message.author, "yellow", title = myEmbedTitle)) : message.channel.send(myResult)
                    }
                } 
                catch (e) {
                    let final = utils.attrGetter(e, "stack", e.toString())
                    if (key.help != undefined) {
                        final += `\nUsage: \`\`${myServer.prefix}${command} ${key.help}\`\``
                    }
                    message.channel.send(embeds.constructResultEmbed(final, message.author))
                }
            }
        }
        else {
            _runCommand(key, message, args, client)
        }
    }
}

module.exports = { importCommands, runCommand, commands, canRunCommand }