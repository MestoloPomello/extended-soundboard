import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import { ActiveGuildInstance } from "../classes/ActiveGuildInstance";
import { getGuildInstance, getVoiceConnection } from "../handlers/connections";
import { logger } from "../classes/Logger";

export const data = new SlashCommandBuilder()
    .setName("join")
    .setDescription("Entra nel canale attuale.");

export async function execute(interaction: CommandInteraction) {
    try {
        const currVoiceChannel = (interaction.member! as GuildMember).voice.channel;
        if (!currVoiceChannel) throw "non sei in un canale vocale.";

		const guildId: string | undefined = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
        if (!guildId) {
            throw "questo comando non funziona in privato.";
        }
        const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 

        const voiceConnection = getVoiceConnection(currVoiceChannel)!;
        const newPlayer = guildInstance.getNewPlayer();
        guildInstance.player = newPlayer;
        voiceConnection.subscribe(newPlayer);
        voiceConnection.on('error', error => {
            throw error;
        });

        const disconnectBtn = new ButtonBuilder()
            .setCustomId("disconnectBtn")
            .setLabel("Disconnetti")
            .setStyle(ButtonStyle.Danger);

        const replyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(disconnectBtn);
        await interaction.reply({
            content: `Entrato in "${currVoiceChannel.name}".\nSoundboard: ${process.env.DASHBOARD_URL}?guildId=${currVoiceChannel.guild.id}`,
            components: [replyRow],
        });
    } catch (error) {
		logger.error("Join command error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
