const database = require("../database")
const utils = require("../utils")
const embeds = require("../embeds")
const { MessageEmbed } = require("discord.js")

let commands = {
    profile: {
        "run": async (message, args, client) => {
            let embed
            let foundUser = await utils.searchUser(client, message, args)
            foundUser == undefined ? embed = await embeds.constructUserProfile(message.author, message.author) : embed = await embeds.constructUserProfile(message.author, foundUser)
            if (embed !== undefined) {
                message.channel.send(embed)
            }
        },
        "help": "<user> - get a profile",
        originalServer: true,
        aliases: ["p"]
    },
    daily: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            foundUser == undefined ? embed = await embeds.constructDailyembed(message.author, message.author) : embed = await embeds.constructDailyembed(message.author, foundUser)
            if (embed !== undefined) {
                message.channel.send(embed)
            }
        },
        "help": "- get daily cheese and money",
        originalServer: true
    },
    top: {
        "run": async (message, args) => {
            let topType = args[0]
            if (topType === undefined || !['cheese', 'money', "rep"].includes(topType)) {
                message.channel.send("Please set type of top: 'cheese', 'money' or 'rep'")
            }
            else {
                let page = (args[1] !== undefined && /^\d+$/.test(args[1])) ? args[1] : 1
                let embed = await embeds.constructTop(message, message.author, topType, page)
                return embed
            }
        },
        "help": "[type] <page> - get top by type and page",
        originalServer: true
    },
    pay: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser !== undefined) {
                if (foundUser.id !== message.author.id) {
                    let authorProfile = await database.getUser(message.author.id)
                    let userProfile = await database.getUser(foundUser.id)
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
                        message.channel.send(embed)
                    }
                }
                else {
                    message.channel.send("No.")
                }
            }
            else {
                let embed = await embeds.constructCanRepEmbed(message.author)
                message.channel.send(embed)
            }
        },
        "help": "[user] - give some cheese to user",
        originalServer: true
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
        originalServer: true
    },
    balance: {
        "run": async (message, args, client) => {
            let aP = await database.getUser(message.author.id)
            if (aP.madness > 2) throw "Access denied!"
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) foundUser = message.author
            let p = await database.getUser(foundUser.id)
            return {"result": `${foundUser} has ${p.money} :moneybag:`, "title": "Money"}
        },
        originalServer: true,
        aliases: ["money", "bal", "m"]
    },
    cheese: {
        "run": async (message, args, client) => {
            let aP = await database.getUser(message.author.id)
            if (aP.madness > 2) throw "Access denied!"
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) foundUser = message.author
            let p = await database.getUser(foundUser.id)
            return {"result": `${foundUser} has ${p.cheese.toFixed(3)} :cheese:`, "title": "Cheese"}
        },
        originalServer: true,
    },
    "duel-stats": {
        "run": async (message, args, client) => {
            let aP = await database.getUser(message.author.id)
            if (aP.madness > 0) throw "Access denied!"
            let foundUser = await utils.searchUser(client, message, args)
            let display
            foundUser != undefined ? display = foundUser.id : display = message.author.id
            let stats = await database.getDuelStats(display)
            let embed = new MessageEmbed().setAuthor(message.author.tag, message.author.displayAvatarURL()).setColor(embeds.colorsMap["yellow"]).setTimestamp(Date.now()).setDescription(`Duel stats of <@${display}>`)
            let kpd
            let e = stats.kills / stats.deaths
            if (Number.isNaN(e)) kpd = 0
            else if (!isFinite(e)) kpd = 100
            else kpd = e * 100
            embed.addField("KPD", `${kpd}%`, true)
            embed.addField("Kills", stats.kills, true)
            embed.addField("Deaths", stats.deaths, true)
            embed.addField("Total Games", stats.total_games)
            embed.addField("Won", `${stats.won} :moneybag:`, true)
            embed.addField("Lost", `${stats.lost} :moneybag:`, true)
            return embed
        },
        originalServer: true,
        help: "<user> - show duel stats"
    },

}

module.exports = { commands }