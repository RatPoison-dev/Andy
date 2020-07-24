let fetch = require("node-fetch")

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
    async checkBans (user) {
        let fetched = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${this.apiKey}&steamids=${user}`)
        let bans = await fetched.json()
        let player = bans.players[0]
        if (player.NumberOfVACBans) {
            return "VAC"
        }
        if (player.NumberOfGameBans) {
            return "OW"
        }
    }
}

module.exports = {WebApi}