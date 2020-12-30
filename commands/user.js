const database = require("../database")
const utils = require("../utils")
const embeds = require("../embeds")

let commands = {
    profile: {
        "run": async (message, args, client) => {
            let embed
            let foundUser = utils.searchUser(client, message, args[0])
            foundUser == undefined ? embed = await embeds.constructUserProfile(message.author) : embed = await embeds.constructUserProfile(foundUser)
            if (embed !== undefined) {
                message.channel.send(embed)
            }
        },
        "help": "[?user] - get a profile",
        originalServer: true
    },
    daily: {
        "run": async (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            foundUser == undefined ? embed = await embeds.constructDailyembed(message.author) : embed = await embeds.constructDailyembed(foundUser)
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
                message.channel.send(embed)
            }
        },
        "help": "[type] [?page] - get top by type and page",
        originalServer: true
    },
    pay: {
        "run": async (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
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
                message.channel.send(":x: User was not found.")
            }
        },
        "help": "[user] [amount] - pay user",
        originalServer: true
    },
    "+rep": {
        "run": async (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
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
        "help": "[user] - take some cheese from user",
        originalServer: true
    },
    "-rep": {
        "run": async (message, args, client) => {
            let foundUser = utils.searchUser(client, message, args[0])
            if (foundUser !== undefined) {
                if (foundUser.id == "258557706892214282") {message.channel.send(":x: пошёл нахуй"); return}
                if (foundUser.id !== message.author.id) {
                    let embed = await embeds.constructMinusRepEmbed(message, message.author, foundUser)
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
                if (embed !== undefined) {
                    message.channel.send(embed)
                }
            }
        },
        "help": "[user] - take some cheese from user",
        originalServer: true
    }

}

module.exports = { commands }