const fetch = require("node-fetch")

class BannedInfo {
    constructor(dbRow, vacs, ows) {
        this.info = dbRow
        this.vacs = vacs
        this.ows = ows
    }
}

class WebApi {
    constructor (apiKey) {
        this.apiKey = apiKey
    }
    async getVanityUrl (vanity) {
        let fetched = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${this.apiKey}&vanityurl=${vanity}`)
        let jsonized = await fetched.json()
        return jsonized["response"]["steamid"]
    }
    async GetPlayerSummaries (player) {
        let fetched = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${player}`)
        let jsonized = await fetched.json()
        return jsonized["response"]["players"][0]
    }
    async rawCheckBans (user) {
        let fetched = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${this.apiKey}&steamids=${user}`)
        let bans = await fetched.json()
        let player = bans.players[0]
        let outArray = []
        if (player.NumberOfVACBans !== undefined) {
            outArray.push(player.NumberOfVACBans)
        }
        else {
            outArray.push(0)
        }
        if (player.NumberOfGameBans !== undefined) {
            outArray.push(player.NumberOfVACBans)
        }
        else {
            outArray.push(0)
        }
        return outArray
    }
    async checkBans (users) {
        let outArray = []
        let usersArray = users.map(it => it.steamID).join(",")
        let fetched = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${this.apiKey}&steamids=${usersArray}`)
        let bans = await fetched.json()
        bans.players.forEach(element => {
            if (element.NumberOfVACBans != undefined) {
                let info = users.find(it => it.steamID == element.SteamId)
                outArray.push(new BannedInfo(info, element.NumberOfVACBans, element.NumberOfGameBans))
            }
            else if (element.NumberOfGameBans !== undefined) {
                let info = users.find(it => it.steamID == element.SteamId)
                outArray.push(new BannedInfo(info, element.NumberOfVACBans, element.NumberOfGameBans))
            }
        })
        return outArray
    }
}

module.exports = {WebApi}