let SteamID = require("steamid")
let steamApi = require("./steamAPI")
let discord = require("discord.js")
let config = require("./config.json")
let api = new steamApi.WebApi(config.steamWebApiKey)

let getRandomElem = (list) => {
    return list[Math.floor(Math.random() * list.length)]
} 

let constructBannedEmbed = async (player, type, client) => {
    let bannedMessage
    let bannedType
    type == "VAC" ? bannedType = config.VACBannedMessage : bannedType = config.OWBannedMessage
    type == "VAC" ? bannedMessage = getRandomElem(config.VACBannedList) : bannedMessage = getRandomElem(config.OWBannedList)
    let embed = new discord.MessageEmbed()
    embed.setTitle(player.displayName)
    embed.setThumbnail(player.playerAvatar)
    embed.setDescription(bannedMessage)
    embed.setURL(`https://steamcommunity.com/profiles/${player.steamID}`)
    let eblo1 = new Date(player.timestamp)
    let substr1 = `${eblo1.getUTCFullYear()}.${eblo1.getUTCMonth()+1}.${eblo1.getUTCDate()}`
    embed.setFooter(`${bannedType}. Was added by ${client.users.cache.get(player.requester).tag} (${substr1})`)
    embed.setColor(0x004080)
    return embed
}

let parseSteamID = (input) => {
    return new Promise(async (resolve, reject) => {
        let parsed = input.match(/^(((http(s){0,1}:\/\/){0,1}(www\.){0,1})steamcommunity\.com\/(id|profiles)\/){0,1}(?<parsed>[A-Z0-9-_]+)(\/{0,1}.{0,})$/i);
        if (!parsed) {
            reject(new Error("Failed to parse SteamID"));
            return;
        }

        let sid = undefined;
        try {
            sid = new SteamID(parsed.groups.parsed);
            if (sid.isValid() && sid.instance === 1 && sid.type === 1 && sid.universe === 1) {
                resolve(sid);
            }
        } catch (e) { }

        // If all of this is true the above one resolved
        if (sid && sid.isValid() && sid.instance === 1 && sid.type === 1 && sid.universe === 1) {
            return;
        }
        let vanity = await api.getVanityUrl(parsed.groups.parsed)
        resolve(new SteamID(vanity))
    })
}

module.exports = {parseSteamID, constructBannedEmbed}