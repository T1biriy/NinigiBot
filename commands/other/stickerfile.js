import {
    ContextMenuCommandBuilder,
    ApplicationCommandType
} from "discord.js";
import logger from "../../util/logger.js";
import sendMessage from "../../util/sendMessage.js";

let returnString = `Here's the link(s) to the assets you requested:`;
let noStickerString = `This only works for messages with stickers attached.`;

export default async (client, interaction) => {
    try {
        let message = await interaction.channel.messages.fetch(interaction.targetId);
        if (!message.stickers || !message.stickers.first()) return sendMessage({ client: client, interaction: interaction, content: noStickerString });

        await message.stickers.forEach(sticker => {
            // stickerURL variable becomes obsolete when Discord.JS gif sticker URLs get fixed; https://github.com/discordjs/discord.js/issues/10329
            let stickerURL = sticker.url;
            if (stickerURL.endsWith(".gif")) stickerURL = stickerURL.replace("cdn.discordapp.com", "media.discordapp.net");
            returnString += `\n[${sticker.name}](${stickerURL})`;
        });
        return sendMessage({ client: client, interaction: interaction, content: returnString });

    } catch (e) {
        logger(e, client, interaction);
    };
};

export const commandObject = new ContextMenuCommandBuilder()
    .setName("Stickerfile")
    .setType(ApplicationCommandType.Message);