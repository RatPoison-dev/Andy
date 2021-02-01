// let commands = {
//     command: (message, args) => {
//         run: () => new Promise((resolve, reject) => {}),
//         usePromises: true,
//         owner: true
//     }
// }

const fs = require("fs")
const config = require("./config.json")
let commands = {}
const database = require("./database")

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
    let isOwner = config["owner_ids"].includes(message.author.id)
    let ownerCheck = (key.owner == true && isOwner) || !key.owner
    let serverCheck = (key.originalServer && message.guild.id == curServer.guild_id) || !key.originalServer
    let permissionsCheck = message.member.permissions.has(key.permissions)
    let disabledCheck = !key.disabled
    if (isOwner) return true
    return ownerCheck && serverCheck && permissionsCheck && disabledCheck
}

let fixCommand = (command) => {
    let ret
    let tmp = commands[command]
    if (tmp !== undefined) ret = command
    Object.keys(commands).forEach(it => {
        let commandObject = commands[it]
        if (commandObject.aliases !== undefined && commandObject.aliases.includes(command)) {
            ret = it
        }
    })
    return ret
}

let runCommand = async (command, message, args, client) => {
    let curServer = await database.fetchServer()
    let key = commands[fixCommand(command)]
    if (key !== undefined) {
        if (key.run !== undefined) {
            if (canRunCommand(key, message, curServer)) {
                if (command.usePromises !== undefined && key.usePromises == true) {
                    _runCommand(key.run, message, args, client).then(resolved => message.channel.send(resolved), rejected => {
                        message.channel.send(rejected.message)
                    })
                }
                else {
                    _runCommand(key.run, message, args, client)
                }
            }
        }
        else {
            _runCommand(key, message, args, client)
        }
    }
}

module.exports = { importCommands, runCommand, commands, canRunCommand }