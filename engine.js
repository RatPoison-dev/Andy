// let commands = {
//  command: (message, args) => {}
//
//}

const fs = require("fs")
let commands = {}
let afters = {}
let importCommands = () => {
    let commandsDir = fs.readdirSync("commands")
    commandsDir.forEach(file => {
        let module = require("./commands/" + file)
        for (let command in module.commands) {
            commands[command] = module.commands[command]
        }
    })
}

let runCommand = (command, message, args, client) => {
    if (commands[command] !== undefined) {
        commands[command](message, args, client)
    }
}

module.exports = { importCommands, runCommand}