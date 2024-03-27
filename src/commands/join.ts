import {
  CommandInteraction,
  SlashCommandBuilder
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
    adapterCreator: currVoiceChannel.guild.voiceAdapterCreator
  });

  interaction.reply({
    content: `Entrato in ${currVoiceChannel.name}.`
  });
}