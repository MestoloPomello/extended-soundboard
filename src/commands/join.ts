import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";

import { joinVoiceChannel } from "@discordjs/voice";
import { createPlayer } from "../mega/audio";

export const data = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Entra nel canale attuale.");

export async function execute(interaction: CommandInteraction) {
  try {
    const currVoiceChannel = (interaction.member! as GuildMember).voice.channel;
    if (!currVoiceChannel) throw "non sei in un canale vocale.";

    const voiceConnection = joinVoiceChannel({
      channelId: currVoiceChannel.id,
      guildId: currVoiceChannel.guild.id,
      adapterCreator: currVoiceChannel.guild.voiceAdapterCreator,
    });

    const newPlayer = createPlayer();
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
      content: `Entrato in "${currVoiceChannel.name}".\nSoundboard: ${process.env.DASHBOARD_URL}`,
      components: [replyRow],
    });
  } catch (error) {
    console.error("[CMD] Join error:", error);
    await interaction.reply({
      content: `Errore: ${error}`
    });
  }
}
