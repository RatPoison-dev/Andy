const database = require("../database")
const utils = require("../utils")
const config = require("../config.json")
const child_process = require("child_process")

let commands = {
    eval: {
        "run": (message, args) => {
            message.channel.send(eval(args.join(" ")).toString())
        },
        owner: true
    },
    bash: {
        "run": (message, args) => {
            child_process.exec(args.join(" "), (err, stdout) => {
                message.channel.send(stdout)
            })
        },
        owner: true
    },
    restart: {
        "run": async (message) => {
            await message.channel.send("Time to die")
            process.exit(0)
        },
        owner: true
    },
    setMadness: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "madness", args[1])
            message.channel.send("Madness was set successfully!")
        },
        owner: true
    },
    setMoney: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "money", args[1])
            message.channel.send("Money was set successfully!")
        },
        owner: true
    },
    setReputation: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "rep", args[1])
            message.channel.send("Reputation was set successfully!")
        },
        owner: true
    },
    rawProfile: {
        "run": async (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            let profile = await database.getUser(foundUser.id)
            message.channel.send(JSON.stringify(profile, 0, 2))
        },
        owner: true
    },
    addReputation: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.incrementUser(foundUser.id, "rep", parseInt(args[1]))
            message.channel.send("Reputation was successfully added!")
        },
        owner: true
    },
    addMoney: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.incrementUser(foundUser.id, "money", args[1])
            message.channel.send("Money was successfully added!")
        },
        owner: true
    },
    addCheese: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.incrementUser(foundUser.id, "cheese", parseFloat(args[1]))
            message.channel.send("Cheese was successfully added!")
        },
        owner: true
    },
    setCheese: {
        "run": (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            database.updateUser(foundUser.id, "cheese", args[1])
            message.channel.send("Cheese was set successfully!")
        },
        owner: true
    },
    restoreMessages: {
        "run": async (message, args, client) => {
            let channel = message.mentions.channels.first()
            let messages = await database.getSaved()
            messages.forEach((row) => {
                let id
                let user = client.users.cache.get(row.user_id)
                if (user !== undefined) {
                    id = user.tag
                }
                else {
                    id = row.user_id
                }
                channel.send(`Message from user: ${id}\nMessage content: ${row.message_content}\n${row.attachments.replace(",", "\n")}`)
            })
        },
        owner: true
    }
}

module.exports = {commands}