const database = require("../database")
const utils = require("../utils")

let commands = {
    eval: (message, args) => {
        if (message.author.id == "355826920270594058") {
            message.channel.send(eval(args.join(" ")).toString())
        }
    },
    setMadness: (message, args, client) => {
        if (message.author.id == "355826920270594058") {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "madness", args[1])
            message.channel.send("Madness was set successfully!")
        }
    },
    setMoney: (message, args, client) => {
        if (message.author.id == "355826920270594058") {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "money", args[1])
            message.channel.send("Money was set successfully!")
        }
    },
    setCheese: (message, args, client) => {
        if (message.author.id == "355826920270594058") {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "cheese", args[1])
            message.channel.send("Cheese was set successfully!")
        }
    }
}

module.exports = {commands}