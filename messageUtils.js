const database = require("./database")
const discord = require("discord.js")
const utils = require("./utils")

let canRunGame = async (user, bet, checkBet = true) => {
    let profile = database.getUser(user.id)
    if (profile.madness > 0) return `${user} has madness!`
    let parsed = parseInt(bet)
    if (checkBet && (isNaN(parsed) || parsed <= 0)) return "Incorrect bet!"
    if (profile.money - bet < 0) return `${user} doesn't have enough money!`
    return true
}

let advancedSearchUser = (message, args, client, bet, searchMessage, acceptMessage) => new Promise(async (resolve, reject) => {
    let foundUser = await utils.searchUser(client, message, args.slice(1))
    if (foundUser) {
        let canRun = await canRunGame(foundUser, bet)
        if (canRun != true) {resolve(canRun); return}
        let myMessage = await message.channel.send(`${foundUser} ${acceptMessage}`)
        await myMessage.react("✅")
        await myMessage.react("❌")
        let rc = new discord.ReactionCollector(myMessage, (r, u) => (["✅", "❌"].includes(r.emoji.name) && u.id == foundUser.id), { time: 60000 })
        rc.on("collect", (r) => {
            switch (r.emoji.name) {
                case "✅": {
                    rc.stop("Accepted")
                    resolve(foundUser)
                }
                case "❌": {
                    rc.stop("Cancelled")
                    myMessage.reactions.removeAll()
                    resolve("Cancelled")
                }
            }
        })
        rc.on("stop", (c, r) => {
            if (r != "Accepted") {
                resolve("Cancelled")
            }
        })
    }
    else {
        let myMessage = await message.channel.send(searchMessage)
        await myMessage.react("✅")
        let rc = new discord.ReactionCollector(myMessage, (r, u) => (["✅"].includes(r.emoji.name) && !u.bot), { time: 60000 })
        rc.on("collect", async (r, u) => {
            let canRun2 = await canRunGame(u, bet, true)
            if (canRun2 != true) {
                message.channel.send(canRun2)
            }
            else {
                rc.stop("Accepted")
                resolve(u)
            }
        })
        rc.on("stop", (c, r) => {
            if (r != "Accepted") {
                resolve("Cancelled")
            }
        })
    }
})

module.exports = {canRunGame, advancedSearchUser}