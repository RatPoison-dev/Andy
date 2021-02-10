const discord = require("discord.js")
const database = require("../database")
const utils = require("../utils")
const config = require("../config.json")

class rrGame {
    static rrGames = []

    constructor (participants, collectTime, channel, bet) {
        this.participants = participants
        this.collectTime = collectTime
        this.channel = channel
        this.bet = bet
        this.sent = false
        this.lastShootTime = 0
        this.lastParticipantIndex = 0
        this.canJoin = true
        rrGame.rrGames.push(this)
    }

    addParticipant(id) {
        this.participants.push(id)
    }

    del() {
        rrGame.rrGames = rrGame.rrGames.filter(it => it != this)
    }

    static byChannel (channel) {
        return rrGame.rrGames.find(it => it.channel.id == channel.id)
    }
}

let canRunDuel = async (user, bet, checkBet = true) => {
    let profile = await database.getUser(user.id)
    if (profile.madness > 0) return `${user} has madness!`
    if (checkBet && (!/^\d+$/.test(bet) || parseInt(bet) <= 0)) return "Incorrect bet!"
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
        if (Date.now() - init <= 10000) {
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
            let canRun = await canRunDuel(host, bet)
            if (canRun != true) {writeChannel.send(canRun); return}

            if (foundUser == undefined) {
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
        aliases: ["duel"],
        help: "[bet] [?user] - play a duel"
    },
    "russianroulette": {
        "run": async (message, args, client) => {
            let channel = message.channel
            let userID = message.author.id
            let bet = args[0]
            let myGame = rrGame.byChannel(channel)
            if (myGame == undefined) {
                let canRun = await canRunDuel(message.author, bet)
                let myPrefix = (await database.getGuildInfo(message.guild.id)).prefix
                if (canRun != true) { channel.send(canRun); return}
                message.channel.send(`**Game of RR starts in 40 seconds. Bet: ${bet} :moneybag:. Type ${myPrefix}rr to join.**`)
                new rrGame([userID], (new Date()).getTime(), channel, bet)
            }
            else {
                let canRun = await canRunDuel(message.author, myGame.bet, false)
                if (canRun != true) { message.channel.send(canRun); return}
                if (myGame.participants.length + 1 > config.rrMaxPlayers) { channel.send("**Game is full! Wait for it to end.**"); return }
                if (myGame.participants.includes(userID)) { channel.send("**You are already taking part in this RR!**"); return }
                if (!myGame.canJoin) { channel.send("Game is already in progress."); return }
                myGame.addParticipant(userID)
                message.channel.send(`**You joined this game of RR. (${myGame.participants.length}/${config.rrMaxPlayers} players)**`)
            }
        },

        originalServer: true,
        aliases: ["rr"],
        help: "[?bet] - play russian roulette"
    }
}

let checkRrGames = async () => {
    rrGame.rrGames.forEach( async (game) => {
        let thisTime = (new Date()).getTime()
        if (((thisTime - game.collectTime) >= 30000) && !game.sent) {
            let myPrefix = (await database.getGuildInfo(game.channel.guild.id)).prefix
            game.channel.send(`**Game of RR starts in less than 15 seconds! Bet: ${game.bet} :moneybag:. Use ${myPrefix}rr to join. (${game.participants.length}/${config.rrMaxPlayers} players)**`)
            game.sent = true
            
        }
        else if ((thisTime - game.collectTime) >= 45000) {
            if (game.participants.length < config.rrMinPlayers) { game.channel.send(`:x: **Not enough players (min: ${config.rrMinPlayers}, current: ${game.participants.length}) to start game of RR**`); game.del(); return }
            if ((thisTime - game.lastShootTime) < 5000) return
            game.canJoin = false
            let thisPlayer = game.participants[game.lastParticipantIndex]
            let chance = Math.random()
            if (chance < (1/config.rrMaxPlayers)) {
                game.channel.send(`<@${thisPlayer}> **died! Everyone else wins ${(game.bet/(game.participants.length-1)).toFixed(3)} :moneybag:**`)
                database.incrementUser(thisPlayer, "money", -game.bet)
                let newArr = game.participants.filter(it => it != thisPlayer)
                newArr.forEach(player => {
                    database.incrementUser(player, "money", game.bet/(game.participants.length-1))
                })
                game.del()
                return
            }
            else {
                game.lastShootTime = (new Date()).getTime()
                if (game.lastParticipantIndex+1 == game.participants.length) {
                    game.lastParticipantIndex = 0
                }
                else {
                    game.lastParticipantIndex += 1
                }
                game.channel.send(`<@${thisPlayer}> **survived! Next is:** <@${game.participants[game.lastParticipantIndex]}>`)
            }
        }   
    })
}

setInterval(checkRrGames, 1000)

module.exports = { commands }