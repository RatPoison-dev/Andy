let database = require("./database")
let config = require("./config.json")
let steamApi = require("./steamAPI")
let embeds = require("./embeds")
let api = new steamApi.WebApi(config.steamWebApiKey)
const chunk = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);
module.exports = class BanChecker {
    constructor (client) {
        this.client = client
    }
    async checkBans () {
        console.log("[BanChecker] Checking for bans")
        let accounts = await database.getBancheckerAccounts()
        let realAccounts = chunk(accounts, 100)
        realAccounts.forEach( async accountList => {
            let outArray = await api.checkBans(accountList)
            outArray.forEach(async account => {
                let VACBanned = account.vacs > account.info.initVAC
                let OWBanned = account.ows > account.info.initOW
                if (VACBanned || OWBanned) {
                    let info = await database.getGuildInfo(account.info.guild_id)
                    if (info.bannedChannel !== null) {
                        let bannedType = VACBanned ? "VAC" : "OW"
                        let embed = await embeds.constructBannedEmbed(account.info, bannedType, this.client)
                        let member = await this.client.users.fetch(account.info.requester)
                        await this.client.channels.cache.get(info.bannedChannel).send(member.toString(), {"embed": embed})
                        database.deleteBancheckerAccount(account.info.steamID)
                    }
                }
            })
        })
    }
}