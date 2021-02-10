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

let searchItem = (shop, item) => {
    let yea
    item.forEach(search => {
        let found = shop.find(it => it.name.toLowerCase() == search.toLowerCase() || it.name.toLowerCase().startsWith(search.toLowerCase()))
        if (found !== undefined) { yea = found; return}
    })
    return yea
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
        let firstArgument = messageArgs[0]
        if (firstArgument !== undefined && /^\d+$/.test(messageArgs[0]) && firstArgument.length >= 16) {
            if (client.users.cache.has(firstArgument)) {
                return client.users.cache.get(firstArgument)
            }
            client.users.fetch(firstArgument).then(resolved => yea = resolved)
        }
        let thisArr = []
        messageArgs.forEach( it => {
            thisArr.push(it)
            let thisSearch = thisArr.join(" ")
            // prioritaze 
            let tmpReturn = message.guild.members.cache.find(member => !member.user.bot && (thisSearch === member.user.username.toLowerCase() || ((member.nickname !== null && member.nickname !== undefined) && (thisSearch == member.nickname.toLowerCase()))))
            if (tmpReturn !== undefined) {
                yea = tmpReturn.user
                return
            }
            else {
                // do the same but for includes
                let tmpReturn2 = message.guild.members.cache.find(member => !member.user.bot && (thisSearch.startsWith(member.user.username.toLowerCase()) || ((member.nickname !== null && member.nickname !== undefined) && (member.nickname.toLowerCase().startsWith(thisSearch)))))
                if (tmpReturn2 !== undefined) { yea = tmpReturn2.user; return }
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

let chunkArray = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);

let clamp = (min, max, value) => {
    if (value > max) return max
    if (value < min) return min
    return value
}

module.exports = {parseSteamID, convertMS, searchUser, str2list, list2str, getRandomElem, serialize, deserialize, list2str2, chunkArray, clamp, searchItem}