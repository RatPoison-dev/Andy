const database = require("./database")
const config = require("./config.json")
const steamApi = require("./steamAPI")
const embeds = require("./embeds")
const api = new steamApi.WebApi(config.steamWebApiKey)
const utils = require("./utils")

module.exports = class BanChecker {
    constructor (client) {
        this.client = client
    }
    async checkBans () {
        let accounts = database.getBancheckerAccounts()
        let realAccounts = utils.chunkArray(accounts, 100)
        realAccounts.forEach( async accountList => {
            let outArray = await api.checkBans(accountList)
            outArray.forEach(async account => {
                let VACBanned = account.vacs > account.info.initVAC
                let OWBanned = account.ows > account.info.initOW
                if (VACBanned || OWBanned) {
                    let info = database.getGuildInfo(account.info.guild_id)
                    if (info.bannedChannel !== null) {
                        let bannedType = VACBanned ? "VAC" : "OW"
                        let embed = await embeds.constructBannedEmbed(account.info, bannedType, this.client)
                        let member = await this.client.users.fetch(account.info.requester)
                        let channel = await this.client.channels.cache.get(info.bannedChannel)
                        if (channel !== undefined) {
                            channel.send(member.toString(), {"embed": embed})
                        }
                        database.run("delete from banChecker where steamID = ?", account.info.steamID)
                    }
                }
            })
        })
    }
}