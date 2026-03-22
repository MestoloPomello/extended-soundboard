import { loadGuilds, saveGuilds } from "../handlers/guilds";
import { replyOrFollowUp } from "../handlers/interactions";
import { logger } from "../classes/Logger";
import {
    SlashCommandBuilder,
    ActivityType,
    ChatInputCommandInteraction,
    MessageFlags,
} from "discord.js";

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
            await replyOrFollowUp(interaction, {
                content: "❌ Solo lo Stefa può usare questo comando!",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const status = interaction.options.get("status")?.value as string;

        interaction.client.user?.setPresence({
            activities: [{ name: status, type: ActivityType.Custom }],
            status: "online"
        });

        const guilds = loadGuilds();
        guilds.find((guild) => guild.id == interaction.guildId)!.status = status;
        saveGuilds(guilds);

        await replyOrFollowUp(interaction, {
            content: `✅ Stato cambiato! Nuovo stato: **${status}**`,
                flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        logger.error("[SetStatus] Error:", error);
        if (interaction.replied || interaction.deferred) {
            await replyOrFollowUp(interaction, {
                content: `Errore: ${error}`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await replyOrFollowUp(interaction, {
                content: `Errore: ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}
