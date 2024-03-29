const database = require("../database")
const engine = require("../engine")
const fs = require("fs")
const utils = require("../utils")

let addCategory = (categories, category, item) => {
    if (categories[category] == undefined) categories[category] = [item]
    else categories[category].push(item)
}

let getRules = (file, args) => {
    let myRules = fs.readFileSync(file, "utf-8").split("\n")
    let rule = parseInt(args[0])
    let final = ""
    if (Number.isNaN(rule) || myRules.length < rule || rule < 0) {
        let argsJoin = args.join(" ")
        if (!argsJoin) { final = myRules.join("\n")}
        else {
            myRules.forEach(it => {
                if (final == "" && it.includes(argsJoin)) {final = it; return}
            })
        }
    }
    else {
        final = myRules[ rule - 1]
    }
    final = final || myRules.join("\n")
    return final
}

let commands = {
    rules: {
        "run": (message, args) => {
            message.channel.send(getRules("./info/rules.md", args))
        },
        originalServer: true,
        aliases: ["rule"]
    },
    modrules: {
        "run": (message, args) => {
            message.channel.send(getRules("./info/modrules.md", args))
        },
        originalServer: true,
        aliases: ["modrule"]
    },

    help: async (message) => {
        let thisGuild = message.guild
        let info = database.getGuildInfo(thisGuild.id)
        let prefix = info.prefix
        let commands = engine.commands
        let s = `Current prefix in \"${thisGuild.name}\" server: ${prefix}\n`
        let categories = {}
        Object.keys(commands).forEach(command => {
            let key = commands[command]
            if (key.help !== undefined) {
                if (engine.canRunCommand(key, message, message.author.id)) {
                    let tmpS = `${command} ${commands[command].help}` 
                    let descArr = []
                    if (key.originalServer == true) descArr.push("RatPoison Server only")
                    if (key.aliases !== undefined) descArr.push(`aliases: ${key.aliases.join(",")}`)
                    let tmpJoin = descArr.join("; ")
                    if (tmpJoin !== "") tmpS += ` (${tmpJoin})`
                    if (key.owner == true) addCategory(categories, "OWNER", tmpS)
                    else if (key.permissions != undefined) addCategory(categories, `Permissions: ${key.permissions}`, tmpS)
                    else addCategory(categories, "USER", tmpS)
                }
            }
        })
        Object.keys(categories).forEach( myCategory => {
            s += `[ ${myCategory} ]\n`
            categories[myCategory].forEach(it => s += `${it}\n`)
            s += "\n"
        })
        // ok thx for the info
        s += fs.readFileSync("./info/help.md", "utf-8")
        Promise.all(utils.chunkMessage(s).map(it => message.author.send(it))).then(() => {message.react("✅")}, () => {message.react("❌")})
    },
    coin: { 
        "run": async (message) => {
            let rand = Math.floor(Math.random() * 2)
            if (rand == 0) {
                message.channel.send(":compass: Heads!")
            }
            else {
                message.channel.send(":compass: Tails!")
            }
        },
        "help": "- Toss a coin"
    },
    kiss: {
        "run":  async (message, args, client) => {
            if (!args[0]) throw "You need to specify who to kiss!"
            message.channel.send("https://tenor.com/view/cat-kitten-love-hug-kiss-gif-10439640")
        }
    },
    // Add some shit here
    dimden: (message) => {
        message.channel.send("Bot is definitely pasted from dimden.")
    },
    andy: (message) => {
        message.channel.send("https://discord.com/api/oauth2/authorize?client_id=736198301598089286&permissions=8&scope=bot")
    },
    invite: (message) => {
        message.channel.send("https://dimden.dev/ratpoisonowns")
    },
    jdk: (message) => {
        message.channel.send("https://www.oracle.com/java/technologies/javase-jdk14-downloads.html")
    },
    master: (message) => {
        message.channel.send("https://github.com/RatPoison-dev/RatPoison/archive/master.zip")
    },
    beta: (message) => {
        message.channel.send("https://github.com/RatPoison-dev/RatPoison/archive/beta.zip")
    },
    "wdal": (message) => {
        message.channel.send("https://github.com/RatPoison-dev/RatPoison/archive/we-do-a-little.zip")
    },
    "cope": (message) => {
        message.channel.send("https://tenor.com/view/cat-kitty-cope-gif-20110606")
    },
    config: {
        "run": (message) => {
            message.channel.send("https://ratpoison.dimden.dev/\nhttps://media.discordapp.net/attachments/789468910076428298/790262074345390100/wherecfg.gif")
        },
        aliases: ["cfg", "configs"]
    },
    release: (message) => {
        message.channel.send("1.7 - https://github.com/Ratpoison-dev/RatPoison/releases/download/1.7.1.6/RatPoison-1.7.1.6.zip\n1.8 - https://github.com/RatPoison-dev/RatPoison/releases/download/1.8.5.10/RatPoison-1.8.5.10.zip")
    },
    crazy: (message) => {
        message.channel.send("https://media.discordapp.net/attachments/254437896365408256/796894005236596736/image0-30.gif")
    },
    //crash: (message) => {
    //    message.channel.send(`Stop right there criminal scum! :raised_hand::oncoming_police_car: \nYour RatPoison is crashing and you are **too retarded** to search for the answer?\nWell, you have to **redownload** it from the GitHub.\nNew-testing: https://github.com/TheFuckingRat/RatPoison/archive/new-testing.zip\nThat's it, **RETARD** :japanese_goblin:`)
    //},
    what: (message) => {
        message.channel.send("https://cdn.discordapp.com/attachments/549942934464757770/722632593668964443/video0.mp4")
    },
    faceit: (message) => {
        message.channel.send("RatPoison will work without any problems if you don't have FaceIT AntiCheat open.\nWith FaceIT AntiCheat RatPoison will be stuck at Launching..., nothing can be done to prevent that.")
    },
    ratto: (message) => {
        message.channel.send("dude RATTO do u have Masochism or sth ?!")
    },
    status: (message) => {
        message.channel.send("https://www.reddit.com/r/ratpoison/comments/p4bq0w/everything_you_need_to_know_about_detection/")
    },
    launching: (message) => {
        message.channel.send("You are stuck at Launching...?\nMake sure you have checked all of those steps:\n- you are running currently most up-to-date version of RatPoison\n- you disabled all anti-cheat clients working on your computer\n- your RatPoison folder is placed somewhere with all running permissions\n- you don't use RatPoison with some other cheats running\n- you aren't currently running VAC bypass (running the bat file with administrator privileges should work)\n- you restarted your computer\n\nIf nothing else works then you can try running the bat file as admin.")
    },
    dir: (message) => {
        message.channel.send("https://edge.dimden.dev/047c416f83.png")
    },
    jammin: (message) => {
        message.channel.send("https://tenor.com/view/rat-jammin-rat-jammin-rat-jamming-gif-18426427")
    }
}

module.exports = {commands}