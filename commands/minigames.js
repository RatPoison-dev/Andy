const discord = require("discord.js")
const database = require("../database")
const utils = require("../utils")
const config = require("../config.json")

class potGame {
    static potGames = []

    constructor(channel) {
        this.participants = {}
        this.dead = []
        this.channel = channel
        this.collectTime = Date.now()
        this.lastShootTime = 0
        potGame.potGames.push(this)
    }

    del() {
        potGame.potGames = potGame.potGames.filter(it => it != this)
    }
    
    calcTotal() {
        return Object.values(this.participants).reduce((a, b) => a + b)
    }

    static byChannel (channel) {
        return potGame.potGames.find(it => it.channel.id == channel.id)
    }
}

class rrGame {
    static rrGames = []

    constructor (participants, channel, bet) {
        this.participants = participants
        this.collectTime = Date.now()
        this.channel = channel
        this.bet = bet
        this.lastShootTime = 0
        this.lastParticipantIndex = 0
        this.startTime = 0
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

let canRunGame = async (user, bet, checkBet = true) => {
    let profile = database.getUser(user.id)
    if (profile.madness > 0) return `${user} has madness!`
    let parsed = parseInt(bet)
    if (checkBet && (isNaN(parsed) || parsed <= 0)) return "Incorrect bet!"
    if (profile.money - bet < 0) return `${user} doesn't have enough money!`
    return true
}

let runDuel = async (host, participant, writeChannel, bet) => {
    let hostID = host.id
    let participantID = participant.id
    let hostCanRun = await canRunGame(host, bet)
    if (hostCanRun != true) {writeChannel.send(hostCanRun); return}
    let participantCanRun = await canRunGame(participant, bet)
    if (participantCanRun != true) {writeChannel.send(participantCanRun); return}
    //let hostProfile = database.getUser(hostID)
    //let participantProfile = database.getUser(participantID)
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
        let loserProfile = database.getUser(loser.id)
        if (loserProfile.money - bet >= 0) {
            database.incrementMinigamesStats(winner.id, ["duels_won_games", "duels_won"], [1, bet])
            database.incrementMinigamesStats(loser.id, ["duels_lost_games", "duels_lost"], [1, bet])
            database.incrementUser(winner.id, "money", bet, "Won a duel")
            database.incrementUser(loser.id, "money", -bet, "Lost a duel")
            writeChannel.send(`${winner} WINS ${bet} :moneybag:`)
            return
        }
        else {
            writeChannel.send(`${loser} doesn't have enough money!`)
        }
    })
}


let commands = {
    duels: {
        "run": async (message, args, client) => {
            let host = message.author
            let foundUser = await utils.searchUser(client, message, args)
            let bet = args[0]
            let writeChannel = message.channel
            let canRun = await canRunGame(host, bet)
            if (canRun != true) {writeChannel.send(canRun); return}
            if (!foundUser) {
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
        //allowedChannels: ["bot-commands"],
        help: "[bet] <user> - play a duel"
    },
    "russianroulette": {
        "run": async (message, args, client) => {
            let channel = message.channel
            let userID = message.author.id
            let bet = args[0]
            let myGame = rrGame.byChannel(channel)
            if (!myGame) {
                let myPrefix = (database.getGuildInfo(message.guild.id)).prefix
                let canRun = await canRunGame(message.author, bet, true)
                if (canRun != true) throw canRun
                bet = parseInt(bet)
                if (!canRun) { message.channel.send(canRun); return}
                database.incrementUser(userID, "money", -bet, "Initial start RR bet")
                message.channel.send(`**Game of RR starts in 45 seconds. Bet: ${bet} :moneybag:. Type ${myPrefix}rr to join.**`)
                setTimeout(() => {
                    let game = rrGame.byChannel(channel)
                    message.channel.send(`**Game of RR starts in less than 15 seconds! Bet: ${game.bet} :moneybag:. Use ${myPrefix}rr to join. (${game.participants.length}/${config.rrMaxPlayers} players)**`)
                }, 30000)
                new rrGame([userID], channel, bet)
            }
            else {
                if (myGame.participants.length + 1 > config.rrMaxPlayers) { channel.send("**Game is full! Wait for it to end.**"); return }
                if (myGame.participants.includes(userID)) { channel.send("**You are already taking part in this RR!**"); return }
                if (Date.now() - myGame.collectTime >= 45000) { channel.send("**Game is already in progress.**"); return }
                let canRun = await canRunGame(message.author, myGame.bet, true)
                if (canRun != true) { message.channel.send(canRun); return}
                myGame.addParticipant(userID)
                database.incrementUser(userID, "money", -myGame.bet, "Joined RR")
                message.channel.send(`**You joined this game of RR. (${myGame.participants.length}/${config.rrMaxPlayers} players)**`)
            }
        },
        originalServer: true,
        aliases: ["rr"],
        //allowedChannels: ["bot-commands"],
        help: "<bet> - play russian roulette",
    },
    //cant wait to see people lose all their money
    "pot": {
        "run": async (message, args, client) => {
            let channel = message.channel
            let userID = message.author.id
            let myGame = potGame.byChannel(channel)
            let bet = args[0]
            let canRun = await canRunGame(message.author, bet, true)
            bet = parseInt(bet)
            if (canRun != true) throw canRun
            if (!myGame) {
                let myPrefix = (database.getGuildInfo(message.guild.id)).prefix
                let myGame = new potGame(channel)
                myGame.participants[userID] = bet
                database.incrementUser(userID, "money", -bet, "Initial start pot bet")
                setTimeout(() => channel.send(`**Pot game starts in 1.5 minutes. Type ${myPrefix}pot to join. Total money: ${Math.floor(potGame.byChannel(channel).calcTotal())} :moneybag:**`), 30000)
                setTimeout(() => channel.send(`**Pot game starts in 1 minute. Type ${myPrefix}pot to join. Total money: ${Math.floor(potGame.byChannel(channel).calcTotal())} :moneybag:**`), 60000)
                setTimeout(() => channel.send(`**Pot game starts in 30 seconds. Type ${myPrefix}pot to join. Total money: ${Math.floor(potGame.byChannel(channel).calcTotal())} :moneybag:**`), 90000)
                channel.send(`**Pot game starts in 2 minutes. Type ${myPrefix}pot to join.**`)
            }
            else {
                if (Date.now() - myGame.collectTime >= 120000) { channel.send("**Game is already in progress.**"); return}
                database.incrementUser(userID, "money", -bet, "Add money to pot")
                if (!myGame.participants[userID]) myGame.participants[userID] = bet
                else myGame.participants[userID] += bet
                let total = Math.floor(myGame.calcTotal())
                message.channel.send(`**You added ${bet} :moneybag: to the pot. Total money in pot: ${total}. Your chance of winning: ${Math.floor(myGame.participants[userID]/total * 100)}%**`)
            }
        },
        originalServer: true,
        //allowedChannels: ["bot-commands"]
    }
}

let runMiniGames = async () => {
    potGame.potGames.forEach( async (game) => {
        let thisTime = Date.now()
        if (thisTime - game.collectTime >= 120000) {
            let myPKeys = Object.keys(game.participants)
            if (myPKeys.length == 1) {
                game.channel.send("**Not enough players to start pot game!**") 
                myPKeys.forEach(it => database.incrementUser(it, "money", game.participants[it], "Pot game rejected"))
                game.del()
                return
            }
            if (Date.now() - game.lastShootTime < 5000) return
            let chosen
            let reduced = {}
            myPKeys.forEach(it => {
                if (!game.dead.includes(it)) {
                    reduced[it] = game.participants[it]
                }
            })
            let myTotal = game.calcTotal()
            while (!chosen) {
                let chance = Math.random()
                let myKeys = Object.keys(reduced)
                let randomP = myKeys[Math.floor(Math.random() * myKeys.length)]
                let myChance = reduced[randomP] / myTotal
                if (chance > myChance) {
                    chosen = randomP
                }
            }
            game.dead.push(chosen)

            if (myPKeys.length == game.dead.length + 1) {
                let winner = myPKeys.find(it => !game.dead.includes(it))
                database.incrementUser(winner, "money", myTotal, "Won the pot")
                database.incrementMinigamesStats(winner, ["pot_won_games", "pot_won"], [1, myTotal - game.participants[winner]])
                game.channel.send(`<@${chosen}> **died and lost ${game.participants[chosen]}!** <@${winner}> **wins ${myTotal} :moneybag:**`)
                game.del()
            }
            else {
                game.channel.send(`<@${chosen}> **died and lost ${game.participants[chosen]}!**`)
                game.lastShootTime = Date.now()
            }
            database.incrementMinigamesStats(chosen, ["pot_lost_games", "pot_lost"], [1, game.participants[chosen]])
        }
    })

    rrGame.rrGames.forEach( async (game) => {
        let thisTime = (new Date()).getTime()
        if ((thisTime - game.collectTime) >= 45000) {
            if (game.participants.length < config.rrMinPlayers) { 
                game.channel.send(`:x: **Not enough players (min: ${config.rrMinPlayers}, current: ${game.participants.length}) to start game of RR**`)
                game.participants.forEach(it => database.incrementUser(it, "money", game.bet, "RR game rejected"))
                game.del()
                return
            }
            if ((thisTime - game.lastShootTime) < 5000) return
            let thisPlayer = game.participants[game.lastParticipantIndex]
            !game.startTime ? game.startTime = Date.now() : game.startTime = game.startTime
            let chance = Math.random()
            if (chance < (1/config.rrMaxPlayers)) {
                game.channel.send(`<@${thisPlayer}> **died! Everyone else wins ${(game.bet/(game.participants.length-1)).toFixed(3)} :moneybag:**`)
                database.incrementMinigamesStats(thisPlayer, ["rr_lost_games", "rr_lost"], [1, game.bet])
                let newArr = game.participants.filter(it => it != thisPlayer)
                let fatShit = game.bet + (game.bet / (game.participants.length - 1))
                newArr.forEach(player => {
                    database.incrementMinigamesStats(player, ["rr_won_games", "rr_won"], [1, game.bet / (game.participants.length - 1)])
                    database.incrementUser(player, "money", fatShit, "RR winner")
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

setInterval(runMiniGames, 1000)

module.exports = { commands }