const database = require("../database")
const utils = require("../utils")
const discord = require("discord.js")
const config = require("../config.json")

let commands = {
    eval: {
        "run": (message, args, client) => {
            message.channel.send(eval(args.join(" ")).toString())
        },
        owner: true
    },
    bash: {
        "run": (message, args) => {
            const Embed = new discord.MessageEmbed()
                .setTitle(`bash`)
                .setColor(`#22ee22`)
                .setFooter(message.author.tag, message.author.displayAvatarURL());
            let exec = require('child_process').exec;
            exec(args.join(" "), function(err, stdout, stderr) {
                Embed.setDescription(`\`${stdout.replace(/\uFFFD/g, '').replace('\s\s\s\s', '\s').replace(/[\u{0080}-\u{FFFF}]/gu,"").slice(0, 1999)}\``);
                message.channel.send(Embed);
            })
        },
        owner: true
    },
    gateway: {
        "run": (message, args) => {
            database.gatewaySwitchState()
            message.channel.send("Bamboozled")
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
    clear: {
        "run": async (message, args, client) => {
            let limit = parseInt(args[0])
            let messages = await message.channel.messages.fetch({"limit": limit+1})
            await message.channel.bulkDelete(messages)
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
    forceWipe: {
        "run": async (message, args, client) => {
            let server = await database.fetchServer()
            let guild = client.guilds.cache.get(server.guild_id)

            config.wipe_channels.forEach( async it => {
                let channels = guild.channels.cache
                channels.forEach( async channel => {
                    if (channel.type == "text" && channel.name == it) {
                        let position = channel.position
                        let newChannel = await channel.clone()
                        await channel.delete()
                        newChannel.setPosition(position)
                    }
                })
            })
            database.updateServer(server.guild_id, "wipeTimestamp", new Date().getTime())
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