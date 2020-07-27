let commands = {
    eval: (message, args) => {
        if (message.author.id == "355826920270594058") {
            message.channel.send(eval(args.join(" ")).toString())
        }
    }
}

module.exports = {commands}