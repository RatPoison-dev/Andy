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

let attrGetter = (obj, attr, def) => {
    if (typeof obj == "object") {
        let a = obj[attr]
        if (a != undefined) return a
        return def
    }
    return def
}

let chunkMessage = (s) => {
    //todo embed autocomplete
    let chunked = []
    let needChunk = Math.floor(s.length / 2000) + 1
    let myRange = Array.from(Array(needChunk).keys())
    myRange.forEach( it => {
        let myMessage = s.slice(it * 2000, (it+1)*2000)
        chunked.push(myMessage)
    } )
    return chunked
}

class Dictionary { //str8 up
    constructor(words) {
        this.words = words;
    };
    similarity(s1, s2) {
        let longer = s1;
        let shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        let longerLength = longer.length;
        if (longerLength === 0) return 1.0;
        return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
    }
    editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
 
        let costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue),
                                costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
    findMostSimilar(term) {
        let a = {};
        for(let i in this.words) a[this.words[i]] = this.similarity(this.words[i], term);
        let r = Object.entries(a).sort( (a,b) => a[1] - b[1] );
        return [r[r.length-1][0], r[r.length-1][1]];
    }
    findSimilar(term) {
        let a = {};
        for(let i in this.words) a[this.words[i]] = this.similarity(this.words[i], term);
        return Object.entries(a).sort( (a,b) => a[1] - b[1] ).reverse();
    }
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
    let mentionsArray = Array.from(message.mentions.users.values())
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
        messageArgs.forEach( async it => {
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
                let tmpReturn2 = message.guild.members.cache.find(member => !member.user.bot && (member.user.username.toLowerCase().startsWith(thisSearch) || ((member.nickname !== null && member.nickname !== undefined) && (member.nickname.toLowerCase().startsWith(thisSearch)))))
                if (tmpReturn2) { yea = tmpReturn2.user; return }
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
            reject("Failed to parse SteamID");
            return;
        }

        let sid = undefined;
        try {
            sid = new SteamID(parsed.groups.parsed);
            if (sid.isValid() && sid.instance === 1 && sid.type === 1 && sid.universe === 1) {
                resolve(sid);
            }
            //else {
            //    reject("Failed to Parse SteamID")
            //}
        } catch (e) { }

        // If all of this is true the above one resolved
        if (sid && sid.isValid() && sid.instance === 1 && sid.type === 1 && sid.universe === 1) {
            return;
        }
        let vanity = await api.getVanityUrl(parsed.groups.parsed)
        if (vanity == undefined) {
            reject("Failed to Parse SteamID")
        }
        else {
            let tmpSid = new SteamID(vanity)
            if (tmpSid.isValid()) {
                resolve(tmpSid)
            }
            else {
                reject("Failed to Parse SteamID")
            }
        }
        resolve(new SteamID(vanity))
    })
}

let chunkArray = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);

let clamp = (min, max, value) => {
    if (value > max) return max
    if (value < min) return min
    return value
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  } 

module.exports = {parseSteamID, convertMS, searchUser, str2list, list2str, getRandomElem, serialize, deserialize, list2str2, chunkArray, clamp, searchItem, attrGetter, Dictionary, chunkMessage, sleep}