const database = require("../database")
const utils = require("../utils")
const discord = require("discord.js")
const config = require("../config.json")
const exec = require('child_process').exec

let commands = {
    eval: {
        "run": (message, args, client) => {
            resolve(eval(args.join(" ")).toString())
        },
        "owner": true
    },
    bash: {
        "run": (message, args) => {
            const Embed = new discord.MessageEmbed()
                .setTitle(`bash`)
                .setColor(`#22ee22`)
                .setFooter(message.author.tag, message.author.displayAvatarURL());
            exec(args.join(" "), function(err, stdout, stderr) {
                Embed.setDescription(`\`${stdout.replace(/\uFFFD/g, '').replace('\s\s\s\s', '\s').replace(/[\u{0080}-\u{FFFF}]/gu,"").slice(0, 1999)}\``);
                message.channel.send(Embed);
            })
        },
        owner: true
    },
    restart: {
        "run": async (message) => {
            await message.channel.send("Time to dir")
            process.exit(0)
        },
        owner: true,
        help: "- restart bot's processs"
    },
    setMadness: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.updateUser(foundUser.id, "madness", parsed)
            message.channel.send("Madness was set successfully!")
        },
        owner: true
    },
    setMoney: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) {message.channel.send("Invalid user!"); return}
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.updateUser(foundUser.id, "money", parsed)
            message.channel.send("Money was set successfully!")
        },
        owner: true
    },
    setReputation: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.updateUser(foundUser.id, "rep", parsed)
            message.channel.send("Reputation was set successfully!")
        },
        owner: true
    },
    rawProfile: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            let profile = await database.getUser(foundUser.id)
            message.channel.send(JSON.stringify(profile, 0, 2))
        },
        owner: true
    },
    sql: {
        "run": async (message, args, client) => {
            if (args[0] == "get") {
                let res = (await database.get(args.slice(1).join(" ")))
                message.channel.send(JSON.stringify(res).slice(0, 1999))
            }
            else if (args[0] == "run") {
                database.run(args.slice(1).join(" "))
                message.react("✅")
            }
        },
        owner: true,
        help: "[get/run] [query] - it does exactly what it does"
    },
    addReputation: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.incrementUser(foundUser.id, "rep", parsed)
            message.channel.send("Reputation was successfully added!")
        },
        owner: true
    },
    clear: {
        "run": async (message, args, client) => {
            let limit = parseInt(args[0])
            limit = utils.clamp(1, 100, limit)
            let messages = await message.channel.messages.fetch({"limit": limit+1})
            await message.channel.bulkDelete(messages)
        },
        owner: true,
    },
    addMoney: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.incrementUser(foundUser.id, "money", parsed)
            message.channel.send("Money was successfully added!")
        },
        owner: true,
        help: "[user] [money] - add money to user"
    },
    addCheese: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.incrementUser(foundUser.id, "cheese", parsed)
            message.channel.send("Cheese was successfully added!")
        },
        owner: true
    },
    setCheese: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let parsed = parseInt(args[1])
            if (Number.isNaN(parsed)) throw "Incorrect amount!"
            database.updateUser(foundUser.id, "cheese", parsed)
            message.channel.send("Cheese was set successfully!")
        },
        owner: true,
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
                channel.send(`Message from user: ${id}\nMessage content: ${row.message_content}\n${row.attachments.replace(/\,/g, '\n')}`)
            })
        },
        owner: true,
        help: "[#channel] - dump saved configs to a channel"
    }
}

module.exports = {commands}