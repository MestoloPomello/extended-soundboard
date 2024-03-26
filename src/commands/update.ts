import {
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

import { createVoiceConnection } from "../shared/voiceConnectionHandler";

export const data = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Entra nel canale attuale.");

export async function execute(interaction: CommandInteraction) {
  const currVoiceChannel = interaction.member.voice.channel;
  
  createVoiceConnection({
    channelId: currVoiceChannel.id,
    guildId: currVoiceChannel.guild.id,
    adapterCreator: currVoiceChannel.guild.voiceAdapterCreator
  });

  interaction.reply({
    content: `Entrato in ${currVoiceChannel.name}.`
  });
}