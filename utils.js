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

let str2list = (str) => {
    if (str == undefined || str == undefined) return []
    else return str.split(",")
}

let searchUser = (client, message, specifiedUser) => {
    let mentionsArray = message.mentions.users.array()
    if (mentionsArray[0] !== undefined) {
        return mentionsArray[0]
    }
    else {
        let foundUser = specifiedUser == undefined ? undefined : client.users.cache.find(user => specifiedUser.toLowerCase().includes(user.username.toLowerCase()))
        foundUser = (foundUser !== undefined && foundUser.bot) ? undefined : foundUser
        return foundUser
    }
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

module.exports = {parseSteamID, convertMS, searchUser, str2list, list2str, getRandomElem}