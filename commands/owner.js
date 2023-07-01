const database = require("../database")
const utils = require("../utils")
const discord = require("discord.js")
const config = require("../config.json")
const exec = require('child_process').exec

let commands = {
    eval: {
        "run": async (message, args, client) => {
            return eval(args.join(" ")).toString()
        },
        "owner": true
    },
    bash: {
        "run": (message, args) => {
            const embed = new discord.EmbedBuilder()
                .setTitle(`bash`)
                .setColor(`#22ee22`)
                .setFooter({text: message.author.username, iconURL: message.author.displayAvatarURL()});
            exec(args.join(" "), function(err, stdout, stderr) {
                embed.setDescription(`\`${stdout.replace(/\uFFFD/g, '').replace('\s\s\s\s', '\s').replace(/[\u{0080}-\u{FFFF}]/gu,"").slice(0, 1999)}\``);
                message.channel.send({embeds: [embed]});
            })
        },
        owner: true
    },
    restart: {
        "run": async (message) => {
            await message.channel.send("non prime")
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
            database.updateUser(foundUser.id, "madness", parsed, `${message.author.username} executed command setMadness`)
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
            database.updateUser(foundUser.id, "money", parsed, `${message.author.username} executed command setMoney`)
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
            database.updateUser(foundUser.id, "rep", parsed, `${message.author.username} executed command setReputation`)
            message.channel.send("Reputation was set successfully!")
        },
        owner: true
    },
    rawProfile: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            let profile = database.getUser(foundUser.id)
            message.channel.send(JSON.stringify(profile, 0, 2))
        },
        owner: true
    },
    sql: {
        "run": async (message, args, client) => {
            if (args[0] == "get") {
                let res = (database.get(args.slice(1).join(" ")))
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
            database.incrementUser(foundUser.id, "rep", parsed, `${message.author.username} executed command addReputation`)
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
            database.incrementUser(foundUser.id, "money", parsed, `${message.author.username} executed command addMoney`)
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
            database.incrementUser(foundUser.id, "cheese", parsed, `${message.author.username} executed command addCheese`)
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
            database.updateUser(foundUser.id, "cheese", parsed, `${message.author.username} executed command setCheese`)
            message.channel.send("Cheese was set successfully!")
        },
        owner: true,
    },
    restoreMessages: {
        "run": async (message, args, client) => {
            let channel = message.mentions.channels.first()
            let messages = database.get("select * from saved_messages")
            messages.forEach((row) => {
                let id
                let user = client.users.cache.get(row.user_id)
                if (user !== undefined) {
                    id = user.username
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