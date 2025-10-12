import {
    CommandInteraction,
    SlashCommandBuilder
} from "discord.js";
import { listAudioFiles, updateAudioFiles } from "../mega/audio";


export const data = new SlashCommandBuilder()
    .setName("update")
    .setDescription("Aggiorna la cache locale di audio dal Mega.");

export async function execute(interaction: CommandInteraction) {

    await interaction.reply({
        content: `Aggiornamento audio avviato.`
    });

    try {
        await updateAudioFiles();
        await listAudioFiles();
        await interaction.followUp({
            content: `Aggiornamento audio terminato.`
        });
    } catch (error) {
        console.log("[CMD] Update error:", error);
        await interaction.followUp({
            content: `L'aggiornamento è andato a puttane: ${error}`
        });
    }
}