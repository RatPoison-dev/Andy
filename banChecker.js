let database = require("./database")
let config = require("./config.json")
let steamApi = require("./steamAPI")
let utils = require("./utils")
let api = new steamApi.WebApi(config.steamWebApiKey)

module.exports = class BanChecker {
    constructor (client) {
        this.client = client
    }
    async checkBans () {
        console.log("[BanChecker] Checking for bans")
        let accounts = await database.getBancheckerAccounts()
        accounts.forEach( async (account) => {
            let checkresult = await api.checkBans(account.steamID)
            if (checkresult !== undefined) {
                let info = await database.getGuildInfo(account.guild_id)
                if (info.bannedChannel !== null) {
                    let embed = await utils.constructBannedEmbed(account, checkresult, this.client)
                    this.client.channels.cache.get(info.bannedChannel).send(this.client.users.cache.get(account.requester).toString(), {"embed": embed})
                    database.deleteBancheckerAccount(account.steamID)
                }
            }
        })
    }
}