let utils = require("../utils")
let steamApi = require("../steamAPI")
let config = require("../config.json")
let db = require("../database")
let api = new steamApi.WebApi(config.steamWebApiKey)

let commands = {
    monitor : (message, args) => {
        let input = args[0]
        utils.parseSteamID(input).then(
            async (sid) => {
                sid = sid.getSteamID64()
                let summaries = await api.GetPlayerSummaries(sid)
                db.addBancheckerAccount(sid, message.author.id, summaries.personaname, summaries.avatarfull, message.guild.id)
                message.channel.send(`[BanChecker] SteamID ${sid} has been added to ban checker.`)
            },
            rejected => {
                message.channel.send(rejected.toString())
            }
        )
    }
}

module.exports = {commands}