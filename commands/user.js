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
    }
}

module.exports = { commands }