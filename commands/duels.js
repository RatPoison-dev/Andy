const discord = require("discord.js")
const database = require("../database")
const utils = require("../utils")

let commands = {
    duels: async (message, args, client) => new Promise(async (resolve, reject) => {
        let bet = args[0]
        if (bet !== undefined && /^\d+$/.test(bet)) {
            let authorProfile = await database.getUser(message.author.id)
            bet = parseInt(bet)
            if (authorProfile.money - bet >= 0) {
                let foundUser = utils.searchUser(client, message, args[1])
                if (foundUser !== undefined && foundUser.id !== message.author.id) {
                    let userProfile = await database.getUser(foundUser.id)
                    if (userProfile.money - bet >= 0) {
                        let msg = await message.channel.send(`${foundUser.tag}, do you accept a duel?`)
                        let rc = new discord.ReactionCollector(msg, (r, u) => foundUser.id == u.id, { time: 60000 });
                        msg.react("✅")
                        msg.react("❌")
                        rc.on("collect", async (r) => {
                            if (r.emoji.name == "✅") {
                                msg.edit("✅ Accepted.")
                                message.channel.send(`1. Click on emoji only when it'll say \"SHOOT\".\n2. Clicking too early will be counted as loss.\n3. When it'll say \"SHOOT\" click quicker than your opponent to win.\n4. Loser gives ${bet} :moneybag: to the winner.`)
                                let ms = await message.channel.send("READY")
                                let timestamp = Date.now()
                                ms.react("🔫")
                                let newRc = new discord.ReactionCollector(ms, (reaction, user) => (user.id == message.author.id || user.id == foundUser.id), { time: 60000 })
                                setTimeout(() => ms.edit("SHOOT"), 10000)
                                newRc.on("collect", async (reaction, user) => {
                                    if (reaction.emoji.name == "🔫") {
                                        if (Date.now() - timestamp < 10000) {
                                            let loserProfile = await database.getUser(user.id)
                                            database.updateUser(user.id, "money", loserProfile.money - bet)
                                            if (user.id == message.author.id) {
                                                let winnerProfile = await database.getUser(foundUser.id)
                                                database.updateUser(foundUser.id, "money", winnerProfile.money + bet)
                                                message.channel.send(`${foundUser.toString()} WINS ${bet} :moneybag:`)
                                            }
                                            else {
                                                let winnerProfile = await database.getUser(message.author)
                                                database.updateUser(message.author, "money", winnerProfile.money + bet)
                                                message.channel.send(`${message.author.toString()} WINS ${bet} :moneybag:`)
                                            }
                                            newRc.stop()
                                            resolve()
                                        }
                                        else {
                                            let winnerProfile = await database.getUser(user.id)
                                            database.updateUser(user.id, "money", winnerProfile.money + bet)
                                            if (user.id == message.author.id) {
                                                let loserProfile = await database.getUser(foundUser.id)
                                                database.updateUser(foundUser.id, "money", loserProfile.money - bet)
                                            }
                                            else {
                                                let loserProfile = await database.getUser(message.author.id)
                                                database.updateUser(message.author.id, "money", loserProfile.money - bet)
                                            }
                                            message.channel.send(`${user.toString()} WINS ${bet} :moneybag:`)
                                            newRc.stop()
                                            resolve()
                                        }
                                    }
                                })
                                rc.stop()
                            }
                            else {
                                msg.edit("❌ Cancalled.")
                                rc.stop()
                            }
                        })
                    }
                    else {
                        message.channel.send("Specified user have not enough money.")
                    }
                }
                // Eventually (tm)
                //else {
                //    message.channel.send(`${message.author.tag} Search some opponents for duel. Click to join`)
                //}
            }
            else {
                message.channel.send("You don't have enough money.")
            }
        }
        else {
            message.channel.send("You need to specify bet.")
        }
    })
}

module.exports = { commands }