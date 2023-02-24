const utils = require("../utils")
const database = require("../database")
const iq_test = require("../iq_test.json")
const config = require("../config.json")
const engine = require("../engine")


let commands = {
    forceWipe: {
        "run": async (message, args, client) => {
            let server = database.fetchServer()
            client.emit("wipeChannels")
            database.updateServer(server.guild_id, "wipeTimestamp", new Date().getTime())
            return "Wipe process started."
        },
        owner: true
    },
    antiRade: {
        "run": (message) => {
            let newState = database.antiRadeSwitchState()
            message.channel.send(`New anti rade state: ${newState}`)
        },
        owner: true
    }
}

module.exports = {commands}