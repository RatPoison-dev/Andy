const SteamID = require("steamid")
const steamApi = require("./steamAPI")
const config = require("./config.json")
let api = new steamApi.WebApi(config.steamWebApiKey)

let getRandomElem = (list) => {
    return list[Math.floor(Math.random() * list.length)]
} 

let list2str = (list) => {
    return list.join(",")
}

let list2str2 = (list) => {
    if (typeof list == 'object') {
        return "["+list.join(",")+"]"
    }
    else if (typeof list == 'string') {
        return "["+list+"]"
    }
}

let str2list = (str) => {
    if (str == undefined || str == "" || str == "[]") return []
    else return str.replace("[", "").replace("]", "").split(",")
}

let serialize = (str) => {
    return JSON.stringify(str)
}

let deserialize = (str) => {
    return JSON.parse(str)
}

let checkIfBot = (user) => {
    if (user == undefined || user.bot) return
    return user
}

let searchUser = async (client, message, messageArgs) => {
    let mentionsArray = message.mentions.users.array()
    let yea
    if (mentionsArray[0] !== undefined) {
        yea = mentionsArray[0]
    }
    else {
        if (/^\d+$/.test(messageArgs[0])) {
            if (client.users.cache.has(messageArgs[0])) {
                return client.users.cache.get(messageArgs[0])
            }
            client.users.fetch(messageArgs[0]).then(resolved => yea = resolved)
        }
        let thisArr = []
        messageArgs.forEach( it => {
            thisArr.push(it)
            let thisSearch = thisArr.join(" ")
            let tmpReturn = message.guild.members.cache.find(member => !member.user.bot && (thisSearch.toLowerCase().includes(member.user.username.toLowerCase())))
            if (tmpReturn !== undefined) {
                yea = tmpReturn.user
                return
            }
        })
    }
    return checkIfBot(yea)
}

function convertMS(ms) {
    let h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    h = h % 24;
  
    let pad = function (n) { return n < 10 ? '0' + n : n; };
  
    let result = pad(h) + ' hours, ' + pad(m) + ' minutes';
    return result;
  };

let parseSteamID = (input) => {
    return new Promise(async (resolve, reject) => {
        let parsed = input.match(/^(((http(s){0,1}:\/\/){0,1}(www\.){0,1})steamcommunity\.com\/(id|profiles)\/){0,1}(?<parsed>[A-Z0-9-_]+)(\/{0,1}.{0,})$/i);
        if (!parsed) {
            reject(new Error("Failed to parse SteamID"));
            return;
        }

        let sid = undefined;
        try {
            sid = new SteamID(parsed.groups.parsed);
            if (sid.isValid() && sid.instance === 1 && sid.type === 1 && sid.universe === 1) {
                resolve(sid);
            }
        } catch (e) { }

        // If all of this is true the above one resolved
        if (sid && sid.isValid() && sid.instance === 1 && sid.type === 1 && sid.universe === 1) {
            return;
        }
        let vanity = await api.getVanityUrl(parsed.groups.parsed)
        resolve(new SteamID(vanity))
    })
}

module.exports = {parseSteamID, convertMS, searchUser, str2list, list2str, getRandomElem, serialize, deserialize, list2str2}