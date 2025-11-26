import {
    CommandInteraction,
    SlashCommandBuilder
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { destroyGuildInstance } from "../handlers/connections";
import { logger } from "../classes/Logger";

export const data = new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Lascia il canale attuale.");

export async function execute(interaction: CommandInteraction) {
    try {
        if (!interaction.guildId) throw "questo comando non funziona in privato.";

        const voiceConnection = getVoiceConnection(interaction.guildId);
        if (!voiceConnection) throw "non sono in un canale vocale.";
        destroyGuildInstance(interaction.guildId);

        interaction.reply({
            content: `Ho abbandonato il canale vocale.`
        });
    } catch (error) {
        logger.error("Leave command error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
