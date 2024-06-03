import Discord from "discord.js";

export default async (client, interaction, logger) => {
    try {
        import sendMessage from "../../util/sendMessage";
        let commandPing = Math.abs(Date.now() - interaction.createdTimestamp);
        let websocketPing = Math.abs(client.ws.ping);
        let replyString = `Pong!\n- Websocket ping is ${websocketPing}ms.\n- Command ping is ${commandPing}ms.`;

        return sendMessage({ client: client, interaction: interaction, content: replyString });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "ping",
    description: `Pings bot.`
};