const database = require("../database")
const utils = require("../utils")

let commands = {
    profile: async (message, args, client) => {
        let embed
        let foundUser = utils.searchUser(client, message, args[0])
        foundUser == undefined ? embed = await utils.constructUserProfile(message.author) : embed = await utils.constructUserProfile(foundUser)
        message.channel.send(embed)
    },
    daily: async (message, args, client) => {
        let foundUser = utils.searchUser(client, message, args[0])
        foundUser == undefined ? embed = await utils.constructDailyembed(message.author) : embed = await utils.constructDailyembed(foundUser)
        message.channel.send(embed)
    },
    top: async (message, args) => {
        let topType = args[0]
        if (topType === undefined || !['cheese', 'money'].includes(topType)) {
            message.channel.send("Please set type of top: 'cheese' or 'money'")
        }
        else {
            let page = (args[1] !== undefined && /^\d+$/.test(args[1])) ? args[1] : 1
            let embed = await utils.constructTop(message.author, topType, page)
            message.channel.send(embed)
        }
    },
    pay: async (message, args, client) => {
        if (args[0] !== undefined) {
            let foundUser = utils.searchUser(client, message, args[0])
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
            message.channel.send("You need to specify user.")
        }
    },
    "+rep": async (message, args, client) => {
        if (args[0] !== undefined) {
            let foundUser = utils.searchUser(client, message, args[0])
            if (foundUser.id !== message.author.id) {
                let embed = await utils.constructRepEmbed(message.author, foundUser)
                message.channel.send(embed)
            }
            else {
                message.channel.send("No.")
            }
        }
        else {
            message.channel.send("You need to specify user.")
        }
    },
    "-rep": async (message, args, client) => {
        if (args[0] !== undefined) {
            let foundUser = utils.searchUser(client, message, args[0])
            if (foundUser.id !== message.author.id) {
                let embed = await utils.constructMinusRepEmbed(message.author, foundUser)
                message.channel.send(embed)
            }
            else {
                message.channel.send("No.")
            }
        }
        else {
            message.channel.send("You need to specify user.")
        }
    }

}

module.exports = { commands }