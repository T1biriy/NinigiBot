export default async (client, oldMember, newMember) => {
    import logger from "../util/logger";
    try {
        // Was used for vc text channel functionality, is now unused
        return;

    } catch (e) {
        // Log error
        logger(e, client);
    };
};