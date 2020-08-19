const discord = require("discord.js")
const database = require("../database")
const utils = require("../utils")

let commands = {
    duels: (message, args, client) => new Promise(async (resolve, reject) => {
        let authorProfile = database.getUser(message.author.id)
        if (authorProfile.madness > 0) return
        let foundUser = utils.searchUser(client, message, args[1])
        if (foundUser == undefined || foundUser.id == message.author.id) return
        let foundUserProfile = await database.getUser(foundUser.id)
        if (foundUserProfile.madness > 0) return
        let bet = args[0]
        if (!/^\d+$/.test(bet) || parseInt(bet) <= 0) return
        bet = parseInt(bet)
        if (authorProfile.money - bet <= 0 || foundUserProfile.money - bet <= 0) return
        let msg = await message.channel.send(`${foundUser.tag}, do you accept a duel?`)
        msg.react("✅")
        msg.react("❌")
        let rc = new discord.ReactionCollector(msg, (r, u) => foundUser.id == u.id)
        rc.on("collect", async (r, u) => {
            switch (r.emoji.name) {
                case "✅": {
                    rc.stop()
                    msg.edit("✅ Accepted")
                    message.channel.send(`1. Click on emoji only when it'll say \"SHOOT\".\n2. Clicking too early will be counted as loss.\n3. When it'll say \"SHOOT\" click quicker than your opponent to win.\n4. Loser gives ${bet} :moneybag: to the winner.`)
                    let ms = await message.channel.send("READY")
                    let init = Date.now()
                    ms.react("🔫")
                    setTimeout(() => ms.edit("SHOOT"), 10000)
                    let newRC = new discord.ReactionCollector(ms, (r, u) => (u.id == foundUser.id || u.id == message.author.id) && r.emoji.name == "🔫")
                    newRC.on("collect", async (_, user) => {
                        newRC.stop()
                        let loser, winner
                        if (Date.now() - init < 10000) {
                            loser = user
                            winner = message.author.id != loser.id ? message.author : foundUser
                        }
                        else {
                            winner = user
                            loser = message.author.id != winner.id ? message.author : foundUser
                        }
                        database.incrementUser(winner.id, "money", bet)
                        database.incrementUser(loser.id, "money", -bet)
                        message.channel.send(`${winner.toString()} WINS ${bet} :moneybag:`)
                        return
                    })
                    break
                }
                case "❌": {
                    rc.stop()
                    msg.edit("❌ Cancelled")
                    return
                }
            }
        })
    })
}

module.exports = { commands }