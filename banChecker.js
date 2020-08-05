let database = require("./database")
let config = require("./config.json")
let steamApi = require("./steamAPI")
let embeds = require("./embeds")
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
            let VACBanned = checkresult[0] > account.initVAC
            let OWBanned = checkresult[1] > account.initOW
            if (VACBanned || OWBanned) {
                let info = await database.getGuildInfo(account.guild_id)
                if (info.bannedChannel !== null) {
                    let bannedType = VACBanned ? "VAC" : "OW"
                    let embed = await embeds.constructBannedEmbed(account, bannedType, this.client)
                    this.client.channels.cache.get(info.bannedChannel).send(this.client.users.cache.get(account.requester).toString(), {"embed": embed})
                    database.deleteBancheckerAccount(account.steamID)
                }
            }
        })
    }
}