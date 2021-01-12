const sqlite = require("sqlite3")
const db = new sqlite.Database("db/database.sqlite3")
const utils = require("./utils")
//const migration = require('better-sqlite3')
//const newDB = new migration("db/database.sqlite3", {
//    readonly: false
//})

db.run("create table if not exists guilds (guild_id TEXT NOT NULL UNIQUE, bannedChannel TEXT, prefix TEXT DEFAULT \"rat!\", PRIMARY KEY(guild_id))")
db.run("create table if not exists banChecker (steamID TEXT NOT NULL UNIQUE, requester TEXT NOT NULL, timestamp integer not null, displayName TEXT NOT NULL, playerAvatar TEXT NOT NULL, guild_id TEXT, initVAC INT, initOW INT,  PRIMARY KEY(steamID))")
db.run("create table if not exists users (user_id TEXT NOT NULL UNIQUE, cheese DOUBLE DEFAULT 0, money INT DEFAULT 0, rep INT DEFAULT 0, dailyTimestamp INT DEFAULT 0, repTimestamp INT DEFAULT 0, repToday TEXT DEFAULT \"\", madness INT DEFAULT 0)")
db.run("create table if not exists saved_messages (user_id TEXT, attachments TEXT, message_content TEXT)")
db.run("create table if not exists server (guild_id TEXT NOT NULL UNIQUE, gatewayNotPassed TEXT default \"[]\", banList TEXT default \"[]\", roles TEXT default \"{}\", backupProcess BOOL default false, getaway BOOL default true, wipeTimestamp int default 0, PRIMARY KEY(guild_id))")
db.run("create table if not exists gateway (user_id TEXT NOT NULL UNIQUE, messages TEXT default \"[]\", tries INT default 0)")

let getGuildInfo = (guild_id) => new Promise((resolve, reject) => {
    initGuild(guild_id)
    db.all("select * from guilds where guild_id = ?", [guild_id], (err, rows) => {
        resolve(rows[0])
    })
})

let migrateActions = (nw, prev) => {
    db.run("update banChecker set guild_id = ? where guild_id = ?", [nw, prev])
    db.run("update server set guild_id = ? where guild_id = ?", [nw, prev])
    db.run("update server set backupProcess = 1 where guild_id = ?", [prev])
}

let gatewayAddMessage = (user_id, message) => {
    db.all("select * from gateway where user_id = ?", [user_id], (err, rows) => {
        if (rows.length == 0) db.run("insert or ignore into gateway (user_id, messages, tries) values (?, ?, 0)", [user_id, utils.list2str2(message)])
        else {
            let parsed = utils.str2list(rows[0].messages)
            parsed.push(message)
            db.run("update gateway set messages = ? where user_id = ?", [utils.list2str2(parsed), user_id])
        }
    })
}

let gatewaySwitchState = () => new Promise(async (resolve, reject) => {
    db.run("update server set getaway = case when getaway = 1 then 0 else 1 end")
    let server = await fetchServer()
    resolve(server.getaway)
})

let increaseGatewayTries = (user_id) => {
    db.run("update gateway set tries = tries + 1 where user_id = ?", [user_id])
    db.run("update gateway set messages = \"[]\" where user_id = ?", [user_id])
}

let getGateway = (user_id) => new Promise((resolve, reject) => {
    db.all("select * from gateway where user_id = ?", [user_id], ((err, rows) => {
        rows[0].messages = utils.str2list(rows[0].messages)
        resolve(rows[0])
    }))
})

let deleteGatewayInfo = (user_id) => {
    db.run("delete from gateway where user_id = ?", [user_id])
}

let initProfile = (user_id) => {
    db.run("insert or ignore into users (user_id) values (?)", [user_id])
}

let query = (q, ...args) => {
    db.run(q, ...args)
}

let select = (q, ...args) => new Promise((resolve, reject) => {
    db.all(q, ...args, (err, rows) => resolve(rows))
})

let fetchServer = () => new Promise((resolve, reject) => {
    db.all("select * from server", [], (err, rows) => {
        let row = rows[0]
        row["banList"] = utils.deserialize(row["banList"])
        row["roles"] = utils.deserialize(row["roles"])
        row["gatewayNotPassed"] = utils.str2list(row["gatewayNotPassed"])
        resolve(row)
    })
})
 
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

let updateServer = (guild_id, columns, values) => {
    if (typeof columns == "object") {
        columns.forEach((column, index) => {
            db.run(`update server set ${column} = ? where guild_id = ?`, [values[index], guild_id])
        })
    }
    else {
        db.run(`update server set ${columns} = ? where guild_id = ?`, [values, guild_id])
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


module.exports = {getGuildInfo, initGuild, addBancheckerAccount, getBancheckerAccounts, getBancheckerAccountsByUser, incrementUser, makeSaved, getSaved, deleteBancheckerAccount, getTopIndex, updateBannedChannel, updatePrefix, updateUser, getUser, getTopByPage, getUserMaxReps, resetRep, query, select, fetchServer, updateServer, migrateActions, gatewayAddMessage, getGateway, deleteGatewayInfo, increaseGatewayTries, gatewaySwitchState}