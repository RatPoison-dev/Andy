const shop = require("../shop")
const utils = require("../utils")
const discord = require("discord.js")
const database = require("../database")

// all inventory based commands
let commands = {
    "shop": {
        "run": async (message, args) => {
            let page
            args[0] == undefined || !/^\d+$/.test(args[0]) || parseInt(args[0]) < 1 ? page = 1 : page = parseInt(args[0])
            page -= 1
            let lShop = shop.filter(it => it.display)
            page = utils.clamp(0, Math.ceil(lShop.length / 10)-1, page)
            let user = message.author
            let profile = await database.getUser(user.id)
            let server = await database.fetchServer()
            let serverInfo = await database.getGuildInfo(server.guild_id)
            let prefix = serverInfo.prefix
            let embed = new discord.MessageEmbed().setTitle("Shop").setColor(0xb6b83d).setTimestamp(new Date().getTime()).setAuthor(user.tag, user.displayAvatarURL())
            embed.setDescription(`Available items. Use \`\`${prefix}buy [count] [item]\`\` to buy and \`\`${prefix}use [item]\`\` to use.\nYour balance: \`\`${profile.money}\`\``)
            embed.setFooter(`Page ${page + 1}`)
            let items = utils.chunkArray(lShop, 10)[page]
            items.forEach( shopItem => {
                let name = `${shopItem.name} - ${shopItem.price} :moneybag:`
                embed.addField(name, shopItem.description)
            })
            embed.setAuthor(user.tag, user.displayAvatarURL())
            return embed
        },
        originalServer: true,
        help: "<page> - View available items"
    },
    "give": {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined || foundUser.id == message.author.id) { message.channel.send("User wasn't found!"); return}
            let user = message.author
            let user_id = user.id
            let item = utils.searchItem(shop, args)
            if (item == undefined) { message.channel.send("You don't have this item!"); return }
            let itemInfo = await database.fetchInventoryItem(user_id, item.item_id)
            let count
            args[1] == undefined || !/^\d+$/.test(args[1]) || parseInt(args[1]) < 1 ? count = 1 : count = parseInt(args[1])
            if (itemInfo == undefined || itemInfo.count - count < 0) { message.channel.send("You don't have this item!"); return }
            database.addItem(user_id, -count, itemInfo.item_id)
            database.addItem(foundUser.id, count, itemInfo.item_id)
            message.channel.send("Transaction completed!")
        },
        originalServer: true,
        help: "[user] [count] [item] - Give item to user"
    },
    "add-item": {
        "run": async (message, args, client) => {
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let item = utils.searchItem(shop, args)
            if (item == undefined) throw "Item wasn't found!"
            let count
            args[1] == undefined || !/^\d+$/.test(args[1]) || parseInt(args[1]) < 1 ? count = 1 : count = parseInt(args[1])
            database.addItem(foundUser.id, count, item.item_id)
            message.channel.send("Inventory was updated!")
        },
        owner: true,
        originalServer: true,
        help: "[user] [count] [item] - Add item to user's inventory"
    },
    "use": {
        "run": async (message, args, client) => {
            let aP = await database.getUser(message.author.id)
            if (aP.madness > 2) throw "Access denied!"
            let user = message.author
            let user_id = user.id
            let item = utils.searchItem(shop, args)
            if (item == undefined) { message.channel.send("You don't have this item!"); return }
            let itemInfo = await database.fetchInventoryItem(user_id, item.item_id)
            if (itemInfo == undefined || itemInfo.count - 1 < 0) { message.channel.send("You don't have this item!"); return }
            let eRes = await item.onUse(message, args, client)
            if (eRes) {
                database.addItem(user_id, -1, item.item_id)
            }
        },
        originalServer: true
    },
    "inventory": {
        "run": async (message, args, client) => {
            let user = await utils.searchUser(client, message, args)
            user = user || message.author
            let userID = user.id
            let page
            args[0] == undefined || !/^\d+$/.test(args[0]) || parseInt(args[0]) < 1 ? page = 1 : page = parseInt(args[0])
            let thisInventory = (await database.fetchInventory(userID)).filter(it => it.count > 0)
            page -= 1
            page = utils.clamp(0, Math.floor(thisInventory.length / 10), page)
            let embed = new discord.MessageEmbed().setTitle("Inventory").setColor(0xb6b83d).setTimestamp(new Date().getTime()).setAuthor(user.tag, user.displayAvatarURL())
            let s = ""
            embed.setFooter(`Page ${page + 1}`)
            thisInventory.forEach( it => {
                let item = shop.find(e => e.item_id == it.item_id)
                s += `${item.name} - ${it.count}\n`
            })
            if (s == "") s = "Empty"
            embed.addField("Items", s)
            message.channel.send(embed)
        },
        originalServer: true,
        aliases: ["inv"],
        help: "<user> - view inventory"
    },
    "buy": {
        "run": async (message, args) => {
            let user = message.author
            let userID = user.id
            let profile = await database.getUser(userID)
            let item = utils.searchItem(shop, args.slice(1))
            if (item == undefined || !item.display) { message.channel.send("Item wasn't found!"); return }
            let count = args[0]
            if (!/^\d+$/.test(count) || parseInt(count) <= 0) { message.channel.send("Incorrect count!"); return}
            count = parseInt(count)
            let realPrice = item.price * count
            if (profile.money - realPrice < 0) { message.channel.send("You don't have enough money!"); return}
            database.addItem(userID, count, item.item_id)
            database.incrementUser(userID, "money", -realPrice, `Bought ${count} ${item.name} (${item.price} per one)`)
            message.channel.send("Transaction completed!")
        },
        originalServer: true,
        help: "[count] [item] - Buy items for money"
    },
    "sell": {
        "run": async (message, args, client) => {
            let userID = message.author.id
            let foundUser = await utils.searchUser(client, message, args)
            if (foundUser == undefined) throw "User wasn't found!"
            let foundUserID = foundUser.id
            let amount = parseInt(args[1])
            if (Number.isNaN(amount) || amount <= 0) throw "Incorrect amount!"
            let price = parseInt(args[2])
            if (Number.isNaN(price) || price < 0) throw "Incorrect sell price!"
            let myItem = utils.searchItem(shop, args.slice(3))
            if (myItem == undefined) throw "You don't have this item!"
            let myInventoryItem = await database.fetchInventoryItem(userID, myItem.item_id)
            if (myInventoryItem == undefined || myInventoryItem.count - amount < 0) throw "You don't have this item!"
            let foundUserProfile = await database.getUser(foundUserID)
            if (foundUserProfile.money - price < 0) throw "User doesn't have enough money!"
            let m = await message.channel.send(`${foundUser}, do you accept the trade?`)
            await m.react("✅")
            await m.react("❌")
            let rc = new discord.ReactionCollector(m, (r, u) => (u.id == foundUserID) && (r.emoji.name == "✅" || r.emoji.name == "❌"))
            rc.on("collect", (reaction, user) => {
                rc.stop()
                switch (reaction.emoji.name) {
                    case "✅": {
                        database.addItem(userID, -amount, myItem.item_id)
                        database.addItem(foundUserID, amount, myItem.item_id)
                        message.channel.send("Transaction completed.")
                    }
                    case "❌": {
                        m.edit("❌ Cancelled")
                        m.reactions.removeAll()
                    }
                }
            })
        },
        "help": "[user] [amount] [price] [item] - sell item to user"
    }
}

module.exports = { commands }