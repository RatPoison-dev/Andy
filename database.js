const utils = require("./utils")

const sqlite3 = require('better-sqlite3')
const db = new sqlite3("db/database.sqlite3", {
    readonly: false
})


let run = (q, ...args) => db.prepare(q).run(...args)
let get = (q, ...args) => db.prepare(q).all(...args)
let one = (q, ...args) => db.prepare(q).get(...args)


run("create table if not exists guilds (guild_id TEXT NOT NULL UNIQUE, bannedChannel TEXT, prefix TEXT DEFAULT \"rat!\", PRIMARY KEY(guild_id))")
run("create table if not exists banChecker (steamID TEXT NOT NULL UNIQUE, requester TEXT NOT NULL, timestamp integer not null, displayName TEXT NOT NULL, playerAvatar TEXT NOT NULL, guild_id TEXT, initVAC INT, initOW INT, description TEXT DEFAULT \"\", PRIMARY KEY(steamID))")
run("create table if not exists users (user_id TEXT NOT NULL UNIQUE, cheese DOUBLE DEFAULT 0, money INT DEFAULT 0, rep INT DEFAULT 0, dailyTimestamp INT DEFAULT 0, repTimestamp INT DEFAULT 0, repToday TEXT DEFAULT \"\", madness INT DEFAULT 0)")
run("create table if not exists saved_messages (user_id TEXT, attachments TEXT, message_content TEXT)")
run("create table if not exists server (guild_id TEXT NOT NULL UNIQUE, banList TEXT default \"[]\", roles TEXT default \"{}\", backupProcess BOOL default false, gateway BOOL default true, wipeTimestamp int default 0, PRIMARY KEY(guild_id))")
run("create table if not exists gateway (user_id TEXT NOT NULL UNIQUE, tries INT default 0, answers text default \"[]\")")
run("create table if not exists inventory (user_id text, count int, item_id int)")
run("create table if not exists minigames_stats (user_id text not null unique, duels_won_games int default 0, duels_lost_games int default 0, duels_won int default 0, duels_lost int default 0, rr_won_games int default 0, rr_won int default 0, rr_lost int default 0, rr_lost_games int default 0, pot_won_games int default 0, pot_lost_games int default 0, pot_won int default 0, pot_lost int default 0)")

let getGuildInfo = (guild_id) => {
    initGuild(guild_id)
    return one("select * from guilds where guild_id = ?", [guild_id])
}

let addItem = (user_id, count, item_id) => {
    let item = fetchInventoryItem(user_id, item_id)
    if (item == undefined) run("insert into inventory (user_id, count, item_id) values (?, ?, ?)", [user_id, count, item_id])
    else run("update inventory set count = ? where user_id = ? and item_id = ?", [count + item.count, user_id, item_id])
}

let fetchInventoryItem = (user_id, item_id) => one("select * from inventory where user_id = ? and item_id = ?", [user_id, item_id])
let fetchInventory = (user_id) => get("select * from inventory where user_id = ?", [user_id])


let migrateActions = (nw, prev) => {
    run("update banChecker set guild_id = ? where guild_id = ?", [nw, prev])
    run("update server set guild_id = ? where guild_id = ?", [nw, prev])
    run("update server set backupProcess = 1 where guild_id = ?", [prev])
}

let updateAnything = (table, unique_key, unique_key_is, columns, values) => {
    if (typeof columns == "object") {
        columns.forEach((column, index) => {
            run(`update ${table} set ${column} = ? where ${unique_key} = ?`, [values[index], unique_key_is])
        })
    }
    else {
        run(`update ${table} set ${columns} = ? where ${unique_key} = ?`, [values, unique_key_is])
    }
}

let gatewayCreateRow = (user_id) => run("insert or ignore into gateway (user_id, tries) values (?, 0)", [user_id])

let gatewaySwitchState = () => {
    run("update server set gateway = case when gateway = 1 then 0 else 1 end")
    return (fetchServer()).gateway
}

let increaseGatewayTries = (user_id) => run("update gateway set tries = tries + 1 where user_id = ?", [user_id])

let getGateway = (user_id) => {
    let rows = get("select * from gateway where user_id = ?", [user_id])
    if (rows[0]) rows[0].answers = utils.str2list(rows[0].answers)
    return rows[0]
}

let deleteGatewayInfo = (user_id) => run("delete from gateway where user_id = ?", [user_id])
let initProfile = (user_id) => run("insert or ignore into users (user_id) values (?)", [user_id])

let fetchServer = () => {
    let row = one("select * from server")
    row["banList"] = utils.deserialize(row["banList"])
    row["roles"] = utils.deserialize(row["roles"])
    return row
}
 
let getTopByPage = (type, page) => get(`select user_id, ${type} from users order by ${type} desc limit ?, 10`, [(page-1)*10])

let getTopIndex = (type, user_id) => (get(`select user_id from users order by ${type} desc`)).findIndex(elem => elem.user_id == user_id)+1

let resetRep = (user) => {
    // bruh
    let profile = getUser(user.id)
    if (Date.now() - profile.repTimestamp > 79200000) {
        updateUser(user.id, "repToday", "", "Reset rep")
        profile.repToday = ""
    }
    return profile
}

let makeSaved = (user_id, attachments, message_content) => {
    run("insert into saved_messages (user_id, attachments, message_content) values (?, ?, ?)", [user_id, attachments, message_content])
}

let updateUser = (user_id, columns, values, reason = "Internal call", log = true) => {
    if (log) console.log(`[UpdateUser] User_id: ${user_id}; Columns: ${columns}; Values: ${values}; Reason: ${reason}`)
    initProfile(user_id)
    updateAnything("users", "user_id", user_id, columns, values)
}

let updateServer = (guild_id, columns, values) => updateAnything("server", "guild_id", guild_id, columns, values)
let updateGuild = (guild_id, ...args) => updateAnything("guilds", "guild_id", guild_id, ...args)

let incrementUser = (user_id, columns, values, reason = "Internal call", log = true) => {
    initProfile(user_id)
    if (log) console.log(`[IncrementUser] User_id: ${user_id}; Columns: ${columns}; Values: ${values}; Reason: ${reason}`)
    let prev = getUser(user_id)
    if (typeof columns == "object") {
        columns.forEach((column, index) => {
            if (Number.isNaN(prev[column]+values[index])) throw `Illegal operation occured! User ID: ${user_id}; Columns: ${JSON.stringify(columns)}; Values ${JSON.stringify(values)}`
            updateUser(user_id, column, prev[column]+values[index], "", log = false)
        })
    }
    else {
        if (Number.isNaN(prev[columns]+values)) throw `Illegal operation occured! User ID: ${user_id}; Columns: ${JSON.stringify(columns)}; Values ${JSON.stringify(values)}`
        updateUser(user_id, columns, prev[columns]+values, "", log = false)
    }
}

let getMinigamesStats = (user_id) => { 
    run("insert or ignore into minigames_stats (user_id) values (?)", [user_id])
    return one("select * from minigames_stats where user_id = ?", [user_id])
}

let incrementMinigamesStats = (user_id, columns, values) => {
    let prev = getMinigamesStats(user_id)
    if (typeof columns == "object") {
        columns.forEach((column, index) => {
            run(`update minigames_stats set ${column} = ? where user_id = ?`, [prev[column]+values[index], user_id])
        })
    }
    else {
        run(`update minigames_stats set ${columns} = ? where user_id = ?`, [prev[columns]+values, user_id])
    }
}


let getUserMaxReps = (user_id) => {
    let user = getUser(user_id)
    return Math.floor(user.cheese) + 5
}

let getUser = (user_id) => {
    let row = one("select * from users where user_id = ?", [user_id])
    if (row) {
        row.money = Math.floor(row.money)
    }
    return row
}

let initGuild = (guild_id) => run("insert or ignore into guilds (guild_id) values (?)", [guild_id])

let addBancheckerAccount = (steamID, requester, displayName, playerAvatar, guild_id, initVAC, initOW, description) => {
    run('insert or ignore into banChecker (steamID, requester, timestamp, displayName, playerAvatar, guild_id, initVAC, initOW, description) values (?, ?, ?, ?, ?, ?, ?, ?, ?)', [steamID, requester, Date.now(), displayName, playerAvatar, guild_id, initVAC, initOW, description])
}

let getBancheckerAccounts = (user) => !user ? get("select * from banChecker") : get("select * from banChecker where requester = ?", [user])


module.exports = {getGuildInfo, initGuild, addBancheckerAccount, getBancheckerAccounts, incrementUser, makeSaved, getTopIndex, updateGuild, updateUser, getUser, getTopByPage, getUserMaxReps, resetRep, fetchServer, updateServer, migrateActions, gatewayCreateRow, getGateway, deleteGatewayInfo, increaseGatewayTries, gatewaySwitchState, get, run, fetchInventory, fetchInventoryItem, addItem, getMinigamesStats, incrementMinigamesStats}