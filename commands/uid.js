const database = require("../database")
const messageUtils = require("../messageUtils")

let options = ["text", "swap"]

let commands = {
    uid: {
        "run": async (message, args, client) => {
            let firstArg = (args[0] || "").toLowerCase()
            let user_id = message.author.id
            let userUID = database.one("select * from uid_table where user_id = ?", user_id)
            if (!options.includes(firstArg)) {
                if (!userUID) {
                    let maxUid = database.one("select max(uid) as max_uid from uid_table")["max_uid"]
                    maxUid = maxUid || 0
                    database.run("insert into uid_table (user_id, uid) values (?, ?)", [user_id, maxUid + 1])
                    return `gg ez ur uid is now ${maxUid + 1}`
                }
                else {
                    return !userUID["message"] ? `Your uid is ${userUID["uid"]}` : `Your uid is ${userUID["uid"]}. Text: ${userUID["message"]}`
                }
            }
            else if (firstArg == "text") {
                if (!user_id) throw "You need to obtain an UID first."
                let realText = args.slice(1).join(" ").split("\n").slice(0, 3).join("\n").replace("```", "").replace("``", "").substring(0, 50)
                if (!realText) throw "You need to specify text."
                database.run("update uid_table set message = ? where user_id = ?", [realText, user_id])
                return "haha who.ru?? hdf pussy uid text was set."
            }
            else if (firstArg == "swap") {
                let foundUser = await messageUtils.advancedSearchUser(message, args, client, undefined, undefined, "Do you accept UID swap?")
                if (foundUser != "Cancelled") {
                    let foundUserUID = database.one("select * from uid_table where user_id = ?", [foundUser.id])
                    if (!foundUserUID) throw "User doesn't have an UID!"
                    database.run("update uid_table set uid = ?, message = ? where user_id = ?", [foundUserUID.uid, userUID.message, user_id])
                    database.run("update uid_table set uid = ?, message = ? where user_id = ?", [userUID.uid, foundUser.message, foundUser.id])
                    return "nice paste 1 lol fag ez gg uid swap completed"
                }
                else {
                    throw "Cancelled."
                }

            }
        },
        help: "<text/swap> - set text/swap uid with user"
    }
}

module.exports = { commands }