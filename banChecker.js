const database = require("./database")
const config = require("./config.json")
const steamApi = require("./steamAPI")
const embeds = require("./embeds")
const api = new steamApi.WebApi(config.steamWebApiKey)
const utils = require("./utils")

class Account {
    constructor(requesters, descriptions, dbRow) {
        this.requesters = requesters
        this.descriptions = descriptions
        this.dbRow = dbRow
        this.vacs = dbRow.initVAC
        this.ows = dbRow.initOW
    }
}

let groupAccounts = (allAccounts) => {
    let all = []
    allAccounts.forEach(it => {
        let tmp = all.find(the => the.dbRow.steamID == it.steamID)
        if (!tmp) all.push(new Account([it.requester], [it.description], it))
        else {
            tmp.requesters.push(it.requester)
            tmp.descriptions.push(it.description)
        }
    })
    return all
}

let bullshit = async (account, client, bannedType, user, isResolved, all, resolvedUsers, rejectedUsers) => {
    if (isResolved) resolvedUsers.push(user)
    else rejectedUsers.push(user)
    if (all.length != resolvedUsers.length + rejectedUsers.length) return // wait for other promises to complete
    else {
        rejectedUsers.forEach(rejectedUser => {
            database.run("delete from banChecker where steamID = ? and requester = ?", account.dbRow.steamID, rejectedUser.id)
        })
        let embed = await embeds.constructBannedEmbed(account, bannedType, resolvedUsers)
        let guildInfo = await database.getGuildInfo(account.dbRow.guild_id)
        if (!guildInfo.bannedChannel) return
        let channel = client.channels.cache.get(guildInfo.bannedChannel)
        if (!channel) return
        channel.send({content: resolvedUsers.map(it => it.toString()).join(" "), embeds: [embed]})
        database.run("delete from banChecker where steamID = ?", [account.dbRow.steamID])
    }
}

module.exports = class BanChecker {
    constructor (client) {
        this.client = client
    }
    async checkBans () {
        let accounts = database.getBancheckerAccounts()
        let realAccounts = utils.chunkArray(groupAccounts(accounts), 100)
        realAccounts.forEach( async accountList => {
            let outArray = await api.checkBans(accountList)
            outArray.forEach(async account => {
                let VACBanned = account.vacs > account.dbRow.initVAC
                let OWBanned = account.ows > account.dbRow.initOW
                if (VACBanned || OWBanned) {
                    let info = database.getGuildInfo(account.dbRow.guild_id)
                    if (info.bannedChannel !== null) {
                        let bannedType = VACBanned ? "VAC" : "OW"
                        let resolvedUsers = []
                        let rejectedUsers = []
                        //ensure all requesters are valid users
                        
                        account.requesters.forEach(it => {
                            this.client.users.fetch(it).then(res => bullshit(account, this.client, bannedType, res, true, account.requesters, resolvedUsers, rejectedUsers)).catch(res => bullshit(account, this.client, bannedType, it, false, account.requesters, resolvedUsers, rejectedUsers))
                        })
                        //let embed = await embeds.constructBannedEmbed(account.info, bannedType, this.client)
                        //let member = await this.client.users.fetch(account.info.requester)
                        //let channel = await this.client.channels.cache.get(info.bannedChannel)
                        //if (channel !== undefined) {
                        //    channel.send(member.toString(), {"embed": embed})
                        //}
                        //database.run("delete from banChecker where steamID = ?", account.info.steamID)
                    }
                }
            })
        })
    }
}