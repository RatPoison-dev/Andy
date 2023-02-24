const database = require("./database")
const config = require("./config.json")
const discord = require("discord.js")

module.exports = [
    {
        "item_id": 0,
        "price": 1,
        "name": "Floppa",
        "display": true,
        "description": "Buy da floppa",
        "onUse": async (message, args, client) => {
            message.channel.send("https://tenor.com/view/floppa-cat-fight-floppa-ears-meme-gif-19426665")
            return true
        }
    },
    {
        "item_id": 3,
        "price": 10000,
        "name": "Megaflop",
        "display": false,
        "onUse": async (message) => {
            let m = await message.channel.send("https://edge.dimden.dev/2842ddb921.png")
            await m.react("❤️")
            let rc = new discord.ReactionCollector(m, {filter: (r, u) => u.id == message.author.id, time: 60000 })
            rc.on("collect", () => {
                rc.stop()
                m.edit("https://tenor.com/view/floppa-my-beloved-floppa-cat-heart-gif-20386309")
            })
            return false
        }
    }
]