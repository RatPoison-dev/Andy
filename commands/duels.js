const discord = require("discord.js")
const database = require("../database")
const utils = require("../utils")

//runs duel between two users

let canRunDuel = async (user, bet) => {
    let profile = await database.getUser(user.id)
    if (profile.madness > 0) return `${user} has madness!`
    if (!/^\d+$/.test(bet) || parseInt(bet) <= 0) return "Incorrect bet!"
    if (profile.money - bet <= 0) return `${user} don't have enough money!`
    return true
}

let runDuel = async (host, participant, writeChannel, bet) => {
    let hostID = host.id
    let participantID = participant.id
    let hostCanRun = await canRunDuel(host, bet)
    if (hostCanRun != true) {writeChannel.send(hostCanRun); return}
    let participantCanRun = await canRunDuel(participant, bet)
    if (participantCanRun != true) {writeChannel.send(participantCanRun); return}
    //let hostProfile = await database.getUser(hostID)
    //let participantProfile = await database.getUser(participantID)
    bet = parseInt(bet)
    let ms = await writeChannel.send("READY\n\n\n\nSTATUS")
    let init = Date.now()
    ms.react("🔫")
    setTimeout(() => ms.edit("SHOOT\n\n\n\nSTATUS"), 10000)
    let newRC = new discord.ReactionCollector(ms, (r, u) => (u.id == participantID || u.id == hostID) && r.emoji.name == "🔫")
    newRC.on("collect", async (_, user) => {
        newRC.stop()
        let loser, winner
        if (Date.now() - init < 10000) {
            loser = user
            winner = hostID != loser.id ? host : participant
        }
        else {
            winner = user
            loser = hostID != winner.id ? host : participant
        }
        database.incrementUser(winner.id, "money", bet)
        database.incrementUser(loser.id, "money", -bet)
        writeChannel.send(`${winner} WINS ${bet} :moneybag:`)
        return
    })
}


let commands = {
    duels: {
        "run": async (message, args, client) => {
            let host = message.author
            let foundUser = await utils.searchUser(client, message, args)
            let bet = args[0]
            let writeChannel = message.channel
            if (foundUser == undefined) {
                let canRun = await canRunDuel(host, bet)
                if (canRun != true) {writeChannel.send(canRun); return}

                let runningDuel = false
                let msg = await writeChannel.send(`${host} Search some opponents for duel. Click to join`)
                msg.react("✅")
                let rc = new discord.ReactionCollector(msg, (r, u) => u.id !== host.id && r.emoji.name == "✅" && !u.bot && !runningDuel, { time: 60000 })
                rc.on("collect", async (reaction, user) => {
                    // block further reactions 
                    runningDuel = true
                    let searchNext = await runDuel(host, user, writeChannel, bet)
                    if (searchNext != false) {
                        rc.stop()
                        return
                    }
                })
            }
            else {
                let msg = await writeChannel.send(`${foundUser} Do you accept a duel?`)
                msg.react("✅")
                msg.react("❌")
                let rc = new discord.ReactionCollector(msg, (r, u) => u.id !== host.id && u.id == foundUser.id, { time: 60000 })
                rc.on("collect", (r, u) => {
                    switch (r.emoji.name) {
                        case "✅": {
                            rc.stop()
                            runDuel(host, foundUser, writeChannel, bet)
                            break
                        }
                        case "❌": {
                            rc.stop()
                            msg.edit("❌ Cancelled.")
                            break
                        }
                    }
                })
            }
        },
        originalServer: true,
        aliases: ["duel"]
    }
}

module.exports = { commands }