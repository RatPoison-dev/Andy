let commands = {
    convert: { 
      run: async (message, args) => {
        message.channel.send(convertBase(args[0], args[1], args[2]))
      },
      owner: true
    },
    bCalc: {
        run: async (message, args) => {
            let first = parseInt(args[0], args[1])
            let second = parseInt(args[3], args[4])
            message.channel.send(eval(`${first} ${args[2]} ${second}`))
        },
        owner: true
    }
}

function convertBase(value, from_base, to_base) {
    var range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
    var from_range = range.slice(0, from_base);
    var to_range = range.slice(0, to_base);
    
    var dec_value = value.split('').reverse().reduce(function (carry, digit, index) {
      if (from_range.indexOf(digit) === -1) throw new Error('Invalid digit `'+digit+'` for base '+from_base+'.');
      return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
    }, 0);
    
    var new_value = '';
    while (dec_value > 0) {
      new_value = to_range[dec_value % to_base] + new_value;
      dec_value = (dec_value - (dec_value % to_base)) / to_base;
    }
    return new_value || '0';
}

module.exports = {commands}