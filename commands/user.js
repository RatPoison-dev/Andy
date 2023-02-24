const database = require("../database")
const utils = require("../utils")
const embeds = require("../embeds")
const discord = require("discord.js")

let commands = {
    profile: {
        "run": async (message, args, client) => {
            let embed
            let foundUser = await utils.searchUser(client, message, args)
            foundUser == undefined ? embed = await embeds.constructUserProfile(message.author, message.author) : embed = await embeds.constructUserProfile(message.author, foundUser)
            if (embed) message.channel.send({embeds: [embed]})
        },
        "help": "<user> - get a profile",
        originalServer: true,
        aliases: ["p"]
    },
    daily: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            let embed
            foundUser == undefined ? embed = await embeds.constructDailyembed(message.author, message.author) : embed = await embeds.constructDailyembed(message.author, foundUser)
            if (embed !== undefined) {
                message.channel.send({embeds: [embed]})
            }
        },
        "help": "- get daily cheese and money",
        originalServer: true
    },
    top: {
        "run": async (message, args) => {
            let topType = args[0]
            if (!topType || !['cheese', 'money', "rep", 'uid'].includes(topType)) throw "Please set type of top: 'cheese', 'money', 'rep' or 'uid'"
            let page = (args[1] !== undefined && /^\d+$/.test(args[1])) ? args[1] : 1
            let top = database.getTopByPage(topType, page)
            let embed = new discord.EmbedBuilder()
            embed.setAuthor({name: message.author.tag, iconURL: message.author.displayAvatarURL()})
            embed.setTitle(`Leaderboard by ${topType}`)
            let desc = ""
            if (topType == "money") {
                let mySum = 0
                database.get("select money from users").forEach(it => mySum += it.money)
                desc += `**Total bank ${Math.floor(mySum)} :moneybag:**\n`
            }
            let membersCache = message.guild.members.cache
            top.forEach ((elem, index) => {
                let userExists = membersCache.get(elem.user_id)
                topType == "uid" ? desc += `${(page-1)*10+index+1}. ` : desc += `${index+1}. `
                desc += userExists ? `<@${elem.user_id}>` : `~~<@${elem.user_id}>`
                if (topType != 'uid') desc += ' • '
                if (topType == "cheese") desc += `${elem[topType].toFixed(3)} :cheese:`
                else if (topType == 'rep') desc += `${elem['rep']}`
                else if (topType == "money") desc += `${Math.floor(elem[topType])} :moneybag:`
                else if (topType == "uid") if (elem["message"] != "") desc += ` • ${elem["message"]}`
                else if (topType != "uid") desc += `${elem[topType]}`
                desc += userExists ? "\n" : "~~\n"
            })
            embed.setFooter({text: `Page ${page}`})
            embed.setDescription(desc)
            embed.setColor(0x6b32a8)
            embed.setTimestamp(Date.now())
            return embed
        },
        "help": "[type] <page> - get top by type and page",
        originalServer: true
    },
    pay: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser !== undefined) {
                if (foundUser.id !== message.author.id) {
                    let authorProfile = database.getUser(message.author.id)
                    let userProfile = database.getUser(foundUser.id)
                    let amount = args[1]
                    if (amount !== undefined && /^\d+$/.test(amount)) {
                        amount = parseInt(amount)
                        let final = authorProfile.money - amount
                        if (final > 0) {
                            database.updateUser(authorProfile.user_id, "money", final)
                            database.updateUser(userProfile.user_id, "money", userProfile.money+amount)
                            message.channel.send("Transaction completed.")
                        }
                        else {
                            message.channel.send("You have not enough money.")
                        }
                    }
                    else {
                        message.channel.send("You need to specify amount.")
                    }
                }
                else {
                    message.channel.send("No.")
                }
            }
            else {
                throw "User was not found."
            }
        },
        "help": "[user] [amount] - pay user",
        originalServer: true
    },
    "+rep": {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser !== undefined) {
                if (foundUser.id !== message.author.id) {
                    let embed = await embeds.constructRepEmbed(message, message.author, foundUser)
                    if (embed !== undefined) {
                        message.channel.send({embeds: [embed]})
                    }
                }
                else {
                    message.channel.send("No.")
                }
            }
            else {
                let embed = await embeds.constructCanRepEmbed(message.author)
                message.channel.send({embeds: [embed]})
            }
        },
        "help": "[user] - give some cheese to user",
        originalServer: true,
        //blockedChannels: ["general"]
    },
    "-rep": {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser !== undefined) {
                if (foundUser.id == "258557706892214282") {message.channel.send(":x: пошёл нахуй"); return}
                if (foundUser.id !== message.author.id) {
                    let embed = await embeds.constructMinusRepEmbed(message, message.author, foundUser)
                    if (embed !== undefined) {
                        return embed
                    }
                }
                else {
                    message.channel.send("No.")
                }
            }
            else {
                let embed = await embeds.constructCanRepEmbed(message.author)
                if (embed !== undefined) {
                    return embed
                }
            }
        },
        "help": "[user] - take some cheese from user",
        originalServer: true,
        //blockedChannels: ["general"]
    },
    balance: {
        "run": async (message, args, client) => {
            let aP = database.getUser(message.author.id)
            if (aP.madness > 2) throw "Access denied!"
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) foundUser = message.author
            let p = database.getUser(foundUser.id)
            return {"result": `${foundUser} has ${p.money} :moneybag:`, "title": "Money"}
        },
        originalServer: true,
        aliases: ["money", "bal", "m"]
    },
    cheese: {
        "run": async (message, args, client) => {
            let aP = database.getUser(message.author.id)
            if (aP.madness > 2) throw "Access denied!"
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) foundUser = message.author
            let p = database.getUser(foundUser.id)
            return {"result": `${foundUser} has ${p.cheese.toFixed(3)} :cheese:`, "title": "Cheese"}
        },
        originalServer: true,
    },
    "duel-stats": {
        "run": async (message, args, client) => {
            return (await embeds.constructStatsBy("duels", client, message, args))
        },
        originalServer: true,
        help: "<user> - show duel stats"
    },
    "rr-stats": {
        "run": async (message, args, client) => {
            return (await embeds.constructStatsBy("rr", client, message, args))
        },
        originalServer: true,
        help: "<user> - show RR stats"
    },
    "pot-stats": {
        "run": async (message, args, client) => {
            return (await embeds.constructStatsBy("pot", client, message, args))
        },
        originalServer: true,
        help: "<user> - show pot stats"
    }
}

module.exports = { commands }