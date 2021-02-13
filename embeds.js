const database = require("./database")
const discord = require("discord.js")
const utils = require("./utils")
const config = require("./config.json")

const colorsMap = {"red": 0xb02020, "green": 0x6b32a8, "yellow": 0xb6b83d}
let constructResultEmbed = (err, author, color = "red", title = ":x: Error") => {
    color = colorsMap[color]
    err = err.replace(/\uFFFD/g, '').replace('\s\s\s\s', '\s').replace(/[\u{0080}-\u{FFFF}]/gu,"").slice(0, 1999)
    let embed = new discord.MessageEmbed().setTimestamp(Date.now()).setAuthor(author.tag, author.avatarURL({dynamic: true})).setDescription(err).setColor(color)
    if (title != "") embed.setTitle(title)
    return embed
}


let constructUserProfile = async (requester, user) => {
    await database.resetRep(user)
    let requesterProfile = await database.getUser(requester.id)
    let profile = await database.getUser(user.id)
    if (requesterProfile.madness < 3) {
        let embed = new discord.MessageEmbed()
        embed.setAuthor(user.tag, user.avatarURL({dynamic: true}))
        embed.setThumbnail(user.avatarURL({dynamic: true}))
        embed.setTitle("Profile")
        let cheesePlace = await database.getTopIndex("cheese", profile.user_id)
        let moneyPlace = await database.getTopIndex("money", profile.user_id)
        let repPlace = await database.getTopIndex("rep", profile.user_id)
        embed.addField("[:cheese:] Cheese", `${profile.cheese.toFixed(3)} | ${cheesePlace} Place`)
        embed.addField("[:moneybag:] Money", `${Math.ceil(profile.money)} | ${moneyPlace} Place`)
        embed.addField("[:art:] Reputation", `${profile.rep} | ${repPlace} Place`)
        let maxReps = await database.getUserMaxReps(user.id)
        embed.addField("[:white_check_mark:] Reps today", `${utils.str2list(profile.repToday).length}/${maxReps}`)
        embed.addField("[:angry:] Madness", `${profile.madness}/3`)
        embed.setColor(0x6b32a8)
        embed.setTimestamp(Date.now())
        return embed
    }
}

let constructCanRepEmbed = async (author) => {
    let authorProfile = await database.resetRep(author)
    let embed = new discord.MessageEmbed()
    if (authorProfile.madness > 1) return
    let maxReps = await database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && utils.str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor(author.tag, author.avatarURL({dynamic: true}))
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        let maxReps = await database.getUserMaxReps(author.id)
        authorProfile = await database.getUser(author.id)
        embed.setTitle("+rep")
        embed.setDescription(`You can +rep/-rep people ${maxReps-utils.str2list(authorProfile.repToday).length} more times.`)
        embed.setColor(0x20b038)
    }
    embed.setTimestamp(Date.now())
    return embed
}

let constructRepEmbed = async (message, author, user) => {
    let authorProfile = await database.resetRep(author)
    let embed = new discord.MessageEmbed()
    if (authorProfile.madness > 1) return
    let userProfile = await database.getUser(user.id)
    let maxReps = await database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && utils.str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor(author.tag, author.avatarURL({dynamic: true}))
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        if (utils.str2list(authorProfile.repToday).includes(user.id)) { message.channel.send(`You already repped this user today!\nYou need to wait **${utils.convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** to +rep/-rep user again.`); return }
        authorProfile = await database.getUser(author.id)
        let cheese = Math.floor(Math.random() * 0.05 * 1000) / 1000
        let money = Math.floor(Math.random() * 200)
        embed.setTitle("+rep")
        embed.setDescription(`You gave <@${user.id}> ${cheese} :cheese: and ${money} :moneybag:`)
        let prev = utils.str2list(authorProfile.repToday)
        prev.push(user.id)
        database.updateUser(user.id, ["cheese", "money", "rep"], [userProfile.cheese+cheese, userProfile.money+money, userProfile.rep+1])
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
    let authorProfile = await database.resetRep(author)
    let embed = new discord.MessageEmbed()
    if (authorProfile.madness > 1) return
    let userProfile = await database.getUser(user.id)
    let maxReps = await database.getUserMaxReps(author.id)
    if (Date.now() - authorProfile.repTimestamp < 79200000 && utils.str2list(authorProfile.repToday).length >= maxReps) {
        embed.setAuthor(author.tag, author.avatarURL({dynamic: true}))
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        if (utils.str2list(authorProfile.repToday).includes(user.id)) { message.channel.send(`You already repped this user today!\nYou need to wait **${utils.convertMS(79200000-(Date.now()-authorProfile.repTimestamp))}** to +rep/-rep user again.`); return }
        authorProfile = await database.getUser(author.id)
        let cheese = Math.floor(Math.random() * 0.05 * 1000) / 1000
        embed.setTitle("-rep")
        let prev = utils.str2list(authorProfile.repToday)
        prev.push(user.id)
        embed.setDescription(`You took from <@${user.id}> ${cheese} :cheese:`)
        database.updateUser(author.id, ["repToday"], [utils.list2str(prev)])
        if (prev.length == 1) {
            database.updateUser(author.id, "repTimestamp", Date.now())
        }
        database.updateUser(user.id, ["rep", "cheese"], [userProfile.rep - 1, userProfile.cheese - cheese])
        embed.setColor(0x20b038)
    }
    return embed
}

let constructDailyembed = async (user, giveTo) => {
    let embed = new discord.MessageEmbed()
    let profile = await database.getUser(user.id)
    if (profile.madness > 1) return
    if (Date.now() - profile.dailyTimestamp < 79200000) {
        embed.setAuthor(user.tag, user.avatarURL({dynamic: true}))
        embed.setTitle(":x: Error")
        embed.setDescription(`You need to wait **${utils.convertMS(79200000-(Date.now()-profile.dailyTimestamp))}** before using this command again.`)
        embed.setColor(0xb02020)
    }
    else {
        embed.setAuthor(user.tag, user.avatarURL({dynamic: true}))
        let cheese = Math.floor(Math.random() * 0.05 * 1000) / 1000
        let money =  Math.floor(Math.random() * 200) + 10
        embed.setTitle("Daily")
        if (giveTo.id == user.id) {
            embed.setDescription(`You recieved your daily ${cheese} :cheese: and ${money} :moneybag:`)
            database.updateUser(user.id, ["cheese", "money", "dailyTimestamp"], [profile.cheese+cheese, profile.money+money, Date.now()])
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


let constructTop = async (message, user, type, page) => {
    
    let top = await database.getTopByPage(type, page)
    let embed = new discord.MessageEmbed()
    embed.setAuthor(user.tag, user.avatarURL({dynamic: true}))
    embed.setTitle(`Leaderboard by ${type}`)
    let desc = ""
    top.forEach ((elem, index) => {
        if (type === "cheese") {
            if (message.guild.members.cache.get(elem.user_id) !== undefined) {
                desc += `${index+1}. <@${elem.user_id}> • ${elem[type].toFixed(3)}\n`
            }
            else {
                desc += `${index+1}. ~~<@${elem.user_id}> • ${elem[type].toFixed(3)}~~\n`
            }
        }
        else {
            if (message.guild.members.cache.get(elem.user_id) !== undefined) {
                desc += `${index+1}. <@${elem.user_id}> • ${Math.floor(elem[type])}\n`
            }
            else {
                desc += `${index+1}. ~~<@${elem.user_id}> • ${Math.floor(elem[type])}~~\n`
            }
        }
    })
    embed.setDescription(desc)
    embed.setColor(0x6b32a8)
    embed.setTimestamp(Date.now())
    return embed
}

let constructBannedEmbed = async (player, type, client) => {
    let bannedMessage
    let bannedType
    type == "VAC" ? bannedType = config.VACBannedMessage : bannedType = config.OWBannedMessage
    type == "VAC" ? bannedMessage = utils.getRandomElem(config.VACBannedList) : bannedMessage = utils.getRandomElem(config.OWBannedList)
    let embed = new discord.MessageEmbed()
    embed.setTitle(player.displayName)
    embed.setThumbnail(player.playerAvatar)
    player.description == "" ? embed.setDescription(bannedMessage) : embed.setDescription(`${bannedMessage}\nDescription:\n**${player.description}**`) 
    embed.setURL(`https://steamcommunity.com/profiles/${player.steamID}`)
    let eblo1 = new Date(player.timestamp)
    let substr1 = `${eblo1.getUTCDate()}.${eblo1.getUTCMonth()+1}.${eblo1.getUTCFullYear()}`
    let tmpUser = await client.users.fetch(player.requester)
    embed.setFooter(`${bannedType}, added by ${tmpUser.tag} (${substr1})`)
    embed.setColor(0x004080)
    return embed
}

module.exports = {constructBannedEmbed, constructTop, constructDailyembed, constructMinusRepEmbed, constructRepEmbed, constructCanRepEmbed, constructUserProfile, constructResultEmbed, colorsMap}