import {
    SlashCommandBuilder,
    ActivityType,
    ChatInputCommandInteraction,
} from "discord.js";
import fs from "fs";
import path from "path";

export const STATUS_FILE = path.join(__dirname, "../../data/status.json");

export const data = new SlashCommandBuilder()
    .setName("status")
    .setDescription("Imposta lo stato del bot.")
    .addStringOption(option =>
        option
            .setName("status")
            .setDescription("Il testo da mostrare nello stato del bot.")
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        if (interaction.user.id !== process.env.OWNER_ID) {
            await interaction.reply({
                content: "❌ Solo lo Stefa può usare questo comando!",
                ephemeral: true
            });
            return;
        }

        const status = interaction.options.get("status")?.value as string;

        interaction.client.user?.setPresence({
            activities: [{ name: status, type: ActivityType.Custom }],
            status: "online"
        });

        const data = { status };
        fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), "utf8");

        await interaction.reply({
            content: `✅ Stato cambiato! Nuovo stato: **${status}**`,
            ephemeral: true
        });
    } catch (error) {
        console.error("[SetStatus] Error:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: `Errore: ${error}`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `Errore: ${error}`,
                ephemeral: true
            });
        }
    }
}
