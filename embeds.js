const database = require("./database")
const discord = require("discord.js")
const utils = require("./utils")
const config = require("./config.json")

const colorsMap = { "red": 0xb02020, "purple": 0x6b32a8, "yellow": 0xb6b83d, "green": 0x22ee22 }
let constructResultEmbed = (err, author, color = "red", title = ":x: Error") => {
    color = colorsMap[color]
    err = typeof err == "string" ? err.replace(/\uFFFD/g, '').replace('\s\s\s\s', '\s').replace(/[\u{0080}-\u{FFFF}]/gu, "").slice(0, 1999) : err
    let embed = new discord.EmbedBuilder().setTimestamp(Date.now()).setAuthor({ name: author.username, iconURL: author.displayAvatarURL() }).setDescription(err).setColor(color)
    if (title != "") embed.setTitle(title)
    return embed
}

let constructStatsBy = async (statsBy, client, message, args) => {
    let aP = database.getUser(message.author.id)
    if (aP.madness > 0) throw "Access denied!"
    let foundUser = await utils.searchUser(client, message, args)
    let display
    foundUser != undefined ? display = foundUser.id : display = message.author.id
    let stats = database.getMinigamesStats(display)
    let embed = new discord.EmbedBuilder().setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() }).setColor(colorsMap["yellow"]).setTimestamp(Date.now()).setDescription(`${statsBy.capitalize()} stats of <@${display}>`)
    let kpd
    let e = stats[`${statsBy}_won_games`] / stats[`${statsBy}_lost_games`]
    if (Number.isNaN(e)) kpd = 0
    else if (!isFinite(e)) kpd = 100
    else kpd = Math.floor(e * 100)
    embed.addFields([
        { name: "KDR", value: `${kpd}%`, "inline": true },
        { name: "Won games", value: stats[`${statsBy}_won_games`].toString(), inline: true },
        { name: "Lost games", value: stats[`${statsBy}_lost_games`].toString(), inline: true },
        { name: "Total Games", value: (stats[`${statsBy}_lost_games`] + stats[`${statsBy}_won_games`]).toString() },
        { name: "Won", value: `${Math.floor(stats[`${statsBy}_won`])} :moneybag:`, inline: true },
        { name: "Lost", value: `${Math.floor(stats[`${statsBy}_lost`])} :moneybag:`, inline: true }
    ])
    return embed
}


let constructUserProfile = async (requester, user) => {
    database.resetRep(user)
    let requesterProfile = database.getUser(requester.id)
    let profile = database.getUser(user.id)
    if (requesterProfile.madness < 3) {
        let embed = new discord.EmbedBuilder()
        embed.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        embed.setThumbnail(user.displayAvatarURL())
        embed.setTitle("Profile")
        let cheesePlace = database.getTopIndex("cheese", profile.user_id)
        let moneyPlace = database.getTopIndex("money", profile.user_id)
        let repPlace = database.getTopIndex("rep", profile.user_id)
        embed.addFields([
            { name: "[:cheese:] Cheese", value: `${profile.cheese.toFixed(3)} | ${cheesePlace} Place` },
            { name: "[:moneybag:] Money", value: `${Math.floor(profile.money)} | ${moneyPlace} Place` },
            { name: "[:art:] Reputation", value: `${profile.rep} | ${repPlace} Place` }
        ])
        let maxReps = database.getUserMaxReps(user.id)
        let myMan = utils.str2list(profile.repToday)
        embed.addFields([
            { name: "[:white_check_mark:] Reps today", value: myMan.length > 0 ? `${myMan.length}/${maxReps} (${myMan.map(it => '<@' + it + '>').join(', ')})` : `${myMan.length}/${maxReps}` },
            { name: "[:angry:] Madness", value: `${profile.madness}/3` }
        ])
        embed.setColor(0x6b32a8)
        embed.setTimestamp(Date.now())
        return embed
    }
    else throw "Access denied! (You have madness)"
}

let constructCanRepEmbed = async (author) => {
    let authorProfile = database.resetRep(author)
    let embed = new discord.EmbedBuilder()
    if (authorProfile.madness > 1) return
    let maxReps = database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && utils.str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000 - (Date.now() - authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        let maxReps = database.getUserMaxReps(author.id)
        authorProfile = database.getUser(author.id)
        embed.setTitle("+rep")
        embed.setDescription(`You can +rep/-rep people ${maxReps - utils.str2list(authorProfile.repToday).length} more times.`)
        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}

let constructRepEmbed = async (message, author, user) => {
    let authorProfile = database.resetRep(author)
    let embed = new discord.EmbedBuilder()
    if (authorProfile.madness > 1) return
    let userProfile = database.getUser(user.id)
    let maxReps = database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && utils.str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000 - (Date.now() - authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        if (utils.str2list(authorProfile.repToday).includes(user.id)) { message.channel.send(`You already repped this user today!\nYou need to wait **${utils.convertMS(79200000 - (Date.now() - authorProfile.repTimestamp))}** to +rep/-rep user again.`); return }
        authorProfile = database.getUser(author.id)
        let cheese = Math.floor(Math.random() * 0.05 * 1000) / 1000
        let money = Math.floor(Math.random() * 200)
        embed.setTitle("+rep")
        embed.setDescription(`You gave <@${user.id}> ${cheese} :cheese: and ${money} :moneybag:`)
        let prev = utils.str2list(authorProfile.repToday)
        prev.push(user.id)
        database.updateUser(user.id, ["cheese", "money", "rep"], [userProfile.cheese + cheese, userProfile.money + money, userProfile.rep + 1], "+rep executed")
        database.updateUser(author.id, ["repToday"], [utils.list2str(prev)])
        if (prev.length == 1) {
            database.updateUser(author.id, "repTimestamp", Date.now())
        }
        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}

let constructMinusRepEmbed = async (message, author, user) => {
    let authorProfile = database.resetRep(author)
    let embed = new discord.EmbedBuilder()
    if (authorProfile.madness > 1) return
    let userProfile = database.getUser(user.id)
    let maxReps = database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && utils.str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000 - (Date.now() - authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        if (utils.str2list(authorProfile.repToday).includes(user.id)) { message.channel.send(`You already repped this user today!\nYou need to wait **${utils.convertMS(79200000 - (Date.now() - authorProfile.repTimestamp))}** to +rep/-rep user again.`); return }
        authorProfile = database.getUser(author.id)
        let cheese = Math.floor(Math.random() * 0.05 * 1000) / 1000
        embed.setTitle("-rep")
        let prev = utils.str2list(authorProfile.repToday)
        prev.push(user.id)
        embed.setDescription(`You took from <@${user.id}> ${cheese} :cheese:`)
        database.updateUser(author.id, ["repToday"], [utils.list2str(prev)], "-rep execited")
        if (prev.length == 1) {
            database.updateUser(author.id, "repTimestamp", Date.now())
        }
        database.updateUser(user.id, ["rep", "cheese"], [userProfile.rep - 1, userProfile.cheese - cheese], "-rep execited")
        embed.setColor(0x20b038)
    }
    return embed
}

let constructDailyembed = async (user, giveTo) => {
    let embed = new discord.EmbedBuilder()
    let profile = database.getUser(user.id)
    if (profile.madness > 1) return
    if (Date.now() - profile.dailyTimestamp < 79200000) {
        embed.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000 - (Date.now() - profile.dailyTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        embed.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        let cheese = Math.floor(Math.random() * 0.05 * 1000) / 1000
        let money = Math.floor(Math.random() * 200) + 10
        embed.setTitle("Daily")
        if (giveTo.id == user.id) {
            embed.setDescription(`You recieved your daily ${cheese} :cheese: and ${money} :moneybag:`)
            database.updateUser(user.id, ["cheese", "money", "dailyTimestamp"], [profile.cheese + cheese, profile.money + money, Date.now()])
        }
        else {
            embed.setDescription(`You gave your daily ${cheese} :cheese: and ${money} :moneybag: to ${giveTo}`)
            database.updateUser(user.id, ["dailyTimestamp"], [Date.now()])
            database.incrementUser(giveTo.id, ["cheese", "money"], [cheese, money])
        }

        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}

let constructBannedEmbed = async (realAccount, type, resolvedUsers) => {
    let bannedMessage
    let bannedType
    type == "VAC" ? bannedType = config.VACBannedMessage : bannedType = config.OWBannedMessage
    type == "VAC" ? bannedMessage = utils.getRandomElem(config.VACBannedList) : bannedMessage = utils.getRandomElem(config.OWBannedList)
    let embed = new discord.EmbedBuilder()
    embed.setTitle(realAccount.dbRow.displayName)
    embed.setThumbnail(realAccount.dbRow.playerAvatar)
    let realDescription = ""
    realAccount.descriptions.forEach(it => {
        if (!it) return
        realDescription += `**${it}**\n`
    })
    realDescription == "" ? embed.setDescription(bannedMessage) : embed.setDescription(`${bannedMessage}\nDescriptions:\n${realDescription}`)
    embed.setURL(`https://steamcommunity.com/profiles/${realAccount.dbRow.steamID}`)
    let eblo1 = new Date(realAccount.dbRow.timestamp)
    let substr1 = `${eblo1.getUTCDate()}.${eblo1.getUTCMonth() + 1}.${eblo1.getUTCFullYear()}`
    embed.setFooter({ text: `${bannedType}, added by ${resolvedUsers.map(it => it.username).join(", ")} (${substr1})` })
    embed.setColor(0x004080)
    return embed
}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

module.exports = { constructBannedEmbed, constructDailyembed, constructMinusRepEmbed, constructRepEmbed, constructCanRepEmbed, constructUserProfile, constructResultEmbed, colorsMap, constructStatsBy }