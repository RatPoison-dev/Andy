const SteamID = require("steamid")
const steamApi = require("./steamAPI")
const discord = require("discord.js")
const config = require("./config.json")
const database = require("./database")
let api = new steamApi.WebApi(config.steamWebApiKey)

let getRandomElem = (list) => {
    return list[Math.floor(Math.random() * list.length)]
} 

let list2str = (list) => {
    return list.join(",")
}

let str2list = (str) => {
    if (str == undefined || str == undefined) return []
    else return str.split(",")
}

let searchUser = (client, message, specifiedUser) => {
    let mentionsArray = message.mentions.users.array()
    if (mentionsArray[0] !== undefined) {
        return mentionsArray[0]
    }
    else {
        let foundUser = specifiedUser == undefined ? undefined : client.users.cache.find(user => specifiedUser.toLowerCase().includes(user.username.toLowerCase()))
        foundUser = (foundUser !== undefined && foundUser.bot) ? undefined : foundUser
        return foundUser
    }
}

let constructUserProfile = async (user) => {
    let profile = await database.getUser(user.id)
    if (profile.madness < 3) {
        let embed = new discord.MessageEmbed()
        embed.setAuthor(user.tag, user.avatarURL())
        embed.setThumbnail(user.avatarURL())
        embed.setTitle("Profile")
        embed.addField("[:cheese:] Cheese", profile.cheese.toFixed(3))
        embed.addField("[:moneybag:] Money", profile.money)
        let maxReps = await database.getUserMaxReps(user.id)
        embed.addField("[:white_check_mark:] Reps", `${str2list(profile.repToday).length}/${maxReps}`)
        embed.addField("[:angry:] Madness", `${profile.madness}/3`)
        embed.setColor(0x6b32a8)
        embed.setTimestamp(Date.now())
        return embed
    }
}

let constructCanRepEmbed = async (author) => {
    let embed = new discord.MessageEmbed()
    let authorProfile = await database.getUser(author.id)
    if (authorProfile.madness > 1) return
    let maxReps = await database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor(author.tag, author.avatarURL())
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        let maxReps = await database.getUserMaxReps(author.id)
        embed.setTitle("+rep")
        embed.setDescription(`You can +rep/-rep people ${maxReps-str2list(authorProfile.repToday).length} more times.`)
        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}

let constructRepEmbed = async (author, user) => {
    let embed = new discord.MessageEmbed()
    let authorProfile = await database.getUser(author.id)
    if (authorProfile.madness > 1) return
    let userProfile = await database.getUser(user.id)
    let maxReps = await database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor(author.tag, author.avatarURL())
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        if (str2list(authorProfile.repToday).includes(user.id)) return
        if (str2list(authorProfile.repToday).length >= maxReps) database.updateUser(author.id, "repToday", "")
        let cheese = Math.floor(Math.random() * 0.08 * 1000) / 1000
        let money =  Math.floor(Math.random() * 200)
        embed.setTitle("+rep")
        embed.setDescription(`You gave <@${user.id}> ${cheese} :cheese: and ${money} :moneybag:`)
        let prev = str2list(authorProfile.repToday)
        prev.push(user.id)
        database.updateUser(user.id, ["cheese", "money", "rep"], [userProfile.cheese+cheese, userProfile.money+money, userProfile.rep+1])
        database.updateUser(author.id, ["repToday", "repTimestamp"], [list2str(prev), Date.now()])
        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}

let constructMinusRepEmbed = async (author, user) => {
    let embed = new discord.MessageEmbed()
    let authorProfile = await database.getUser(author.id)
    if (authorProfile.madness > 1) return
    let userProfile = await database.getUser(user.id)
    let maxReps = await database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && authorProfile.repToday >= maxReps) {
        embed.setAuthor(author.tag, author.avatarURL())
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        if (str2list(authorProfile.repToday).includes(user.id)) return
        if (str2list(authorProfile.repToday).length >= maxReps) database.updateUser(author.id, "repToday", "")
        let cheese = Math.floor(Math.random() * 0.08 * 1000) / 1000
        embed.setTitle("-rep")
        let prev = str2list(authorProfile.repToday)
        prev.push(user.id)
        embed.setDescription(`You took from <@${user.id}> ${cheese} :cheese:`)
        database.updateUser(author.id, ["repToday", "repTimestamp"], [list2str(prev), Date.now()])
        database.updateUser(user.id, ["rep", "cheese"], [userProfile.rep - 1, userProfile.cheese - cheese])
        embed.setColor(0x20b038)
    }
    return embed
}

let constructDailyembed = async (user) => {
    let embed = new discord.MessageEmbed()
    let profile = await database.getUser(user.id)
    if (profile.madness > 1) return
    if (Date.now() - profile.dailyTimestamp < 79200000) {
        embed.setAuthor(user.tag, user.avatarURL())
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${convertMS(79200000-(Date.now()-profile.dailyTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        embed.setAuthor(user.tag, user.avatarURL())
        let cheese = Math.floor(Math.random() * 0.08 * 1000) / 1000
        let money =  Math.floor(Math.random() * 200)
        embed.setTitle("Daily")
        embed.setDescription(`You recieved your daily ${cheese} :cheese: and ${money} :moneybag:`)
        database.updateUser(user.id, ["cheese", "money", "dailyTimestamp"], [profile.cheese+cheese, profile.money+money, Date.now()])
        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}


let constructTop = async (user, type, page) => {
    let top = await database.getTopByPage(type, page)
    let embed = new discord.MessageEmbed()
    embed.setAuthor(user.tag, user.avatarURL())
    embed.setTitle(`Leaderboard by ${type}`)
    let desc = ""
    top.forEach ((elem, index) => {
        desc += `${index+1}. <@${elem.user_id}> • ${elem[type].toFixed(3)}\n`
    })
    embed.setDescription(desc)
    embed.setColor(0x6b32a8)
    embed.setTimestamp(Date.now())
    return embed
}


function convertMS(ms) {
    let h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    h = h % 24;
  
    let pad = function (n) { return n < 10 ? '0' + n : n; };
  
    let result = pad(h) + ' hours, ' + pad(m) + ' minutes';
    return result;
  };

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

module.exports = {parseSteamID, constructBannedEmbed, searchUser, constructUserProfile, constructDailyembed, constructTop, constructCanRepEmbed, constructRepEmbed, constructMinusRepEmbed}