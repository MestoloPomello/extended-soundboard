import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

import { joinVoiceChannel } from "@discordjs/voice";

export const data = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Entra nel canale attuale.");

export async function execute(interaction: CommandInteraction) {
  const currVoiceChannel = interaction.member.voice.channel;

  joinVoiceChannel({
    channelId: currVoiceChannel.id,
    guildId: currVoiceChannel.guild.id,
    adapterCreator: currVoiceChannel.guild.voiceAdapterCreator,
  });

  const disconnectBtn = new ButtonBuilder()
    .setCustomId("disconnectBtn")
    .setLabel("Disconnetti")
    .setStyle(ButtonStyle.Danger);

  const replyRow = new ActionRowBuilder().addComponents(disconnectBtn);

  await interaction.reply({
    content: `Entrato in "${currVoiceChannel.name}".\nSoundboard: ${process.env.DASHBOARD_URL}`,
    components: [replyRow],
  });
}
