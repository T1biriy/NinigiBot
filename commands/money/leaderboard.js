exports.run = async (client, message) => {
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const { bank } = require('../../database/bank');
        return message.channel.send(
            bank.currency.sort((a, b) => b.balance - a.balance)
                .filter(user => client.users.cache.has(user.user_id))
                .first(10)
                .map((user, position) => `(${position + 1}) ${(client.users.cache.get(user.user_id).tag)}: ${Math.floor(user.balance)}${globalVars.currency}`)
                .join('\n'),
            { code: true }
        );

    } catch (e) {
        // log error
        let {logger} = require('../../events/ready');
        logger(e, message.channel);

        // return confirmation
        return message.channel.send(`> An error has occurred trying to run the command. The error has already been logged, but please also report this as an issue on the Github page or send a message to Glaze#6669. For links and other information use ${globalVars.prefix}info.`);
    };
};