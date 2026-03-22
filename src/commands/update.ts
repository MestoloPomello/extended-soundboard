import {
    CommandInteraction,
    SlashCommandBuilder
} from "discord.js";
import { listAudioFiles, updateAudioFiles } from "../handlers/audio";
import { logger } from "../classes/Logger";
import { replyOrFollowUp } from "../handlers/interactions";


export const data = new SlashCommandBuilder()
    .setName("update")
    .setDescription("Aggiorna la cache locale di audio dal Mega.");

export async function execute(interaction: CommandInteraction) {

    await replyOrFollowUp(interaction, {
        content: `Aggiornamento audio avviato.`
    });

    try {
        await updateAudioFiles();
        await listAudioFiles();
        await replyOrFollowUp(interaction, {
            content: `Aggiornamento audio terminato.`
        });
    } catch (error) {
        logger.error("Update error:", error);
        await replyOrFollowUp(interaction, {
            content: `L'aggiornamento è andato a puttane: ${error}`
        });
    }
}
