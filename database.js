let sqlite = require("sqlite3")
let db = new sqlite.Database("db/database.sqlite3")

db.run("create table if not exists guilds (guild_id TEXT NOT NULL UNIQUE, bannedChannel TEXT, prefix TEXT DEFAULT \"rat!\", PRIMARY KEY(guild_id))")
db.run("create table if not exists banChecker (steamID TEXT NOT NULL UNIQUE, requester TEXT NOT NULL, timestamp integer not null, displayName TEXT NOT NULL, playerAvatar TEXT NOT NULL, guild_id TEXT, PRIMARY KEY(steamID))")
db.run("create table if not exists tags (user_id TEXT, tag TEXT, value TEXT)")


let getGuildInfo = (guild_id) => new Promise((resolve, reject) => {
    initGuild(guild_id)
    db.all("select * from guilds where guild_id = ?", [guild_id], (err, rows) => {
        resolve(rows[0])
    })
})

let createTag = async (user_id, tag, value) => {
    let tags = await getTags(user_id)
    if (tags.length < 5) {
        db.run("insert into tags (user_id, tag, value) values (?, ?, ?)", [user_id, tag, value])
        return true
    }
}

let deleteTag = (user_id, tag) => {
    db.run("delete from tags where user_id = ? and tag = ?", [user_id, tag])
}

let getTags = (user_id) => new Promise((resolve, reject) => {
    db.all("select tag from tags where user_id = ?", [user_id], (err, rows) => {
        rows = rows.map(elem => {
            return elem.tag
        })
        resolve(rows)
    })
})

let getTag = (user_id, tag) => new Promise((resolve, reject) => {
    db.all("select * from tags where user_id = ? and tag = ?", [user_id, tag], (err, rows) => {
        resolve(rows[0])
    })
})

let initGuild = (guild_id) => {
    db.run("insert or ignore into guilds (guild_id) values (?)", [guild_id])
}

let updatePrefix = (guild_id, prefix) => {
    db.run("update guilds set prefix = ? where guild_id = ?", [prefix, guild_id])
}

let updateBannedChannel = (guild_id, channel) => {
    db.run("update guilds set bannedChannel = ? where guild_id = ?", [channel, guild_id])
}

let addBancheckerAccount = (steamID, requester, displayName, playerAvatar, guild_id) => {
    db.run('insert or ignore into banChecker (steamID, requester, timestamp, displayName, playerAvatar, guild_id) values (?, ?, ?, ?, ?, ?)', [steamID, requester, Date.now(), displayName, playerAvatar, guild_id])
}

let getBancheckerAccounts = () => new Promise((resolve, reject) => {
    // fuck you pasted sqlite3 developers
    db.all("select * from banChecker", (err, rows) => {
        resolve(rows)
    })
})

let deleteBancheckerAccount = (sid) => {
    db.run("delete from banChecker where steamID = ?", [sid])
}


module.exports = {getGuildInfo, initGuild, addBancheckerAccount, getBancheckerAccounts, deleteBancheckerAccount, updateBannedChannel, updatePrefix, createTag, deleteTag, getTags, getTag}