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

let set_after = (user, func, ...args) => {
    afters[user] = [func, args]
}

let call_after = (msg, user) => {
    arr = afters[user]
    arr[0](msg, ...arr[1])
    delete afters[user]
}

let checkAfters = (user) => {
    if (afters[user] !== undefined) {
        return true
    }
    return false
}

let runCommand = (user, command, message, args, client) => {
    if (!checkAfters(user)) {
        if (commands[command] !== undefined) {
            commands[command](message, args, client)
        }
    }
    else {
        call_after(message, user)
    }
}
module.exports = { importCommands, runCommand, set_after, checkAfters }