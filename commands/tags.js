const database = require("../database")

let commands = {
    tags: async (message, args) => {
        user = message.author.id
        switch (args[0]) {
            case undefined:
                message.channel.send("Usage: tags create [name] [value] OR tags delete [name] OR tags list")
                break
            case "create":
                if (args[1] !== undefined && args[2] !== undefined) {
                    res = await database.createTag(user, args[1], args.slice(2).join(" "))
                    if (res !== undefined) {
                        message.channel.send("Tag was successfully created!")
                    }
                    else {
                        message.channel.send("You reached tags limit!")
                    }
                }
                else {
                    message.channel.send("You need to specify tag/value")
                }
                break
            case "delete":
                if (args[1] !== undefined) {
                    database.deleteTag(user, args[1])
                    message.channel.send("Tag was successfully deleted!")
                }
                else {
                    message.channel.send("You need to specify tag/value")
                }
                break
            case "list": 
                let tags = await database.getTags(user)
                message.channel.send(`Your tags: ${tags.join(", ")}`)
                break
        }
    }
}

module.exports = { commands }