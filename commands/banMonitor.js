const utils = require("../utils")
const steamApi = require("../steamAPI")
const config = require("../config.json")
const db = require("../database")
const api = new steamApi.WebApi(config.steamWebApiKey)

let commands = {
    monitor : {
        "run": async (message, args) => {
            let input = args[0]
            let description = args.slice(1).join(" ")
            if (input.includes("steamcommunity.com/")) {
                let sid = await utils.parseSteamID(input)
                sid = sid.getSteamID64()
                let summaries = await api.GetPlayerSummaries(sid)
                let initList = await api.rawCheckBans(sid)
                db.addBancheckerAccount(sid, message.author.id, summaries.personaname, summaries.avatarfull, message.guild.id, initList[0], initList[1], description)
                message.channel.send(`[BanChecker] SteamID ${sid} has been added to ban checker.`)
            }
        },
        "help": "[link] - add account to bans monitor"
    },
    countMonitor: {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser === undefined) {
                let accounts = await db.getBancheckerAccounts()
                return `There are ${accounts.length} accounts in ban checker database.`
            }
            else {
                let accounts = await db.getBancheckerAccountsByUser(foundUser.id)
                return `There are ${accounts.length} accounts in ban checker database that was added by this user.`
            }
        },
        "help": "<user> - get number of accounts in ban checker databse"
    }
}

module.exports = {commands}