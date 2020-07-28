const utils = require("../utils")
const steamApi = require("../steamAPI")
const config = require("../config.json")
const db = require("../database")
const api = new steamApi.WebApi(config.steamWebApiKey)

let commands = {
    monitor : (message, args) => {
        let input = args[0]
        if (input.includes("steamcommunity.com/")) {
            utils.parseSteamID(input).then(
                async (sid) => {
                    sid = sid.getSteamID64()
                    let summaries = await api.GetPlayerSummaries(sid)
                    let initList = await api.checkBans(sid)
                    db.addBancheckerAccount(sid, message.author.id, summaries.personaname, summaries.avatarfull, message.guild.id, initList[0], initList[1])
                    message.channel.send(`[BanChecker] SteamID ${sid} has been added to ban checker.`)
                },
                rejected => {
                    message.channel.send(rejected.toString())
                }
            )
        }
    }
}

module.exports = {commands}