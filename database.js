const sqlite = require("sqlite3")
const db = new sqlite.Database("db/database.sqlite3")

db.run("create table if not exists guilds (guild_id TEXT NOT NULL UNIQUE, bannedChannel TEXT, prefix TEXT DEFAULT \"rat!\", PRIMARY KEY(guild_id))")
db.run("create table if not exists banChecker (steamID TEXT NOT NULL UNIQUE, requester TEXT NOT NULL, timestamp integer not null, displayName TEXT NOT NULL, playerAvatar TEXT NOT NULL, guild_id TEXT, initVAC INT, initOW INT,  PRIMARY KEY(steamID))")
db.run("create table if not exists users (user_id TEXT NOT NULL UNIQUE, cheese DOUBLE DEFAULT 0, money INT DEFAULT 0, rep INT DEFAULT 0, dailyTimestamp INT DEFAULT 0, repTimestamp INT DEFAULT 0, repToday TEXT DEFAULT \"\", madness INT DEFAULT 0)")
db.run("create table if not exists saved_messages (user_id TEXT, attachments TEXT, message_content TEXT)")


let getGuildInfo = (guild_id) => new Promise((resolve, reject) => {
    initGuild(guild_id)
    db.all("select * from guilds where guild_id = ?", [guild_id], (err, rows) => {
        resolve(rows[0])
    })
})

let initProfile = (user_id) => {
    db.run("insert or ignore into users (user_id) values (?)", [user_id])
}

let getTopByPage = (type, page) => new Promise((resolve, reject) => {
    db.all(`select user_id, ${type} from users order by ${type} desc limit ?, 10`, [(page-1)*10], (err, rows) => {
        resolve(rows)
    })
})

let getTopIndex = (type, user_id) => new Promise((resolve, reject) => {
    db.all(`select user_id from users order by ${type} desc`, (err, rows) => {
        resolve(rows.findIndex(elem => elem.user_id == user_id)+1)
    })
})

let resetRep = async (user) => {
    // bruh
    let profile = await getUser(user.id)
    if (Date.now() - profile.repTimestamp > 79200000) {
        updateUser(user.id, "repToday", "")
        profile.repToday = ""
    }
    return profile
}

let makeSaved = (user_id, attachments, message_content) => {
    db.run("insert into saved_messages (user_id, attachments, message_content) values (?, ?, ?)", [user_id, attachments, message_content])
}

let getSaved = () => new Promise((resolve, reject) => {
    db.all("select * from saved_messages", (err, rows) => {
        resolve(rows)
    } )
})

let updateUser = (user_id, columns, values) => {
    initProfile(user_id)
    if (typeof columns == "object") {
        columns.forEach((column, index) => {
            db.run(`update users set ${column} = ? where user_id = ?`, [values[index], user_id])
        })
    }
    else {
        db.run(`update users set ${columns} = ? where user_id = ?`, [values, user_id])
    }
}

let incrementUser = async (user_id, columns, values) => {
    let prev = await getUser(user_id)
    if (typeof columns == "object") {
        columns.forEach((column, index) => {
            updateUser(user_id, column[index], prev[values[index]]+values[index])
        })
    }
    else {
        updateUser(user_id, columns, prev[columns]+values)
    }
}

let getUserMaxReps = async (user_id) => {
    let user = await getUser(user_id)
    return Math.floor(user.cheese) + 5
}

let getUser = (user_id) => new Promise((resolve, reject) => {
    initProfile(user_id)
    db.all("select * from users where user_id = ?", [user_id], (err, rows) => {
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

let addBancheckerAccount = (steamID, requester, displayName, playerAvatar, guild_id, initVAC, initOW) => {
    db.run('insert or ignore into banChecker (steamID, requester, timestamp, displayName, playerAvatar, guild_id, initVAC, initOW) values (?, ?, ?, ?, ?, ?, ?, ?)', [steamID, requester, Date.now(), displayName, playerAvatar, guild_id, initVAC, initOW])
}

let getBancheckerAccounts = () => new Promise((resolve, reject) => {
    // fuck you pasted sqlite3 developers
    db.all("select * from banChecker", (err, rows) => {
        resolve(rows)
    })
})

let getBancheckerAccountsByUser = (user_id) => new Promise((resolve, reject) => {
    db.all("select * from banChecker where requester = ?", [user_id], (err, rows) => {
        resolve(rows)
    })
})

let deleteBancheckerAccount = (sid) => {
    db.run("delete from banChecker where steamID = ?", [sid])
}


module.exports = {getGuildInfo, initGuild, addBancheckerAccount, getBancheckerAccounts, getBancheckerAccountsByUser, incrementUser, makeSaved, getSaved, deleteBancheckerAccount, getTopIndex, updateBannedChannel, updatePrefix, updateUser, getUser, getTopByPage, getUserMaxReps, resetRep}