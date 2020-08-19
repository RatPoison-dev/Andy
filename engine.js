// let commands = {
//  command: (message, args) => {}
//
//}

const fs = require("fs")
const config = require("./config.json")
let commands = {}

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
    command(...args)
}

let runCommand = (command, message, args, client) => {
    if (commands[command] !== undefined) {
        let key = commands[command]
        if (key.run !== undefined) {
            if (key.owner === true && config["owner_ids"].includes(message.author.id)) {
                _runCommand(key.run, message, args, client)
            }
            else if (key.permissions !== undefined && (message.member.permissions.has(key.permissions) || config["owner_ids"].includes(message.author.id))) {
                _runCommand(key.run, message, args, client)
            }
        }
        else {
            _runCommand(key, message, args, client)
        }
    }
}

module.exports = { importCommands, runCommand, commands}