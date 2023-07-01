const fetch = require("node-fetch")
const config = require("./config.json")

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
            outArray.push(player.NumberOfGameBans)
        }
        else {
            outArray.push(0)
        }
        return outArray
    }
    async checkBans (users) {
        let outArray = []
        let usersArray = users.map(it => it.dbRow.steamID).join(",")
        let fetched = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${this.apiKey}&steamids=${usersArray}`)
        try {
            let bans = await fetched.json()
            bans.players.forEach(element => {
                if (element.NumberOfVACBans != undefined || element.NumberOfGameBans !== undefined) {
                    let info = users.find(it => it.dbRow.steamID == element.SteamId)
                    info.vacs = element.NumberOfVACBans
                    info.ows = element.NumberOfGameBans
                    outArray.push(info)
                }
            })
            return outArray
        }
        catch(e) {
            return users
        }
    }
}

const api = new WebApi(config.steamWebApiKey)

module.exports = {WebApi, api}