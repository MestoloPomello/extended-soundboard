import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

import { createVoiceConnection } from "../shared/voiceConnectionHandler";

export const data = new SlashCommandBuilder()
  .setName("start")
  .setDescription("Joins your channel and starts the soundboard.");

export async function execute(interaction: CommandInteraction) {

  const target = interaction.options.getUser('target');

  const currVoiceChannel = interaction.member.voice.channel;
  const voiceConnection = createVoiceConnection({
    channelId: currVoiceChannel.id,
    guildId: currVoiceChannel.guild.id,
    adapterCreator: currVoiceChannel.guild.voiceAdapterCreator
  });


  // await interaction.guild.channels.cache.get(interaction.member.).join()
  // 	.then(async (connessione) => {
  // 		player(connessione);
  // 	})
  // 	.catch((err) => {
  // 		console.error(err);
  // 	})

  const test1 = new ButtonBuilder()
    .setCustomId('test1')
    .setLabel('Test1')
    .setStyle(ButtonStyle.Secondary);

  const disconnectBtn = new ButtonBuilder()
    .setCustomId('disconnectBtn')
    .setLabel('Disconnect')
    .setStyle(ButtonStyle.Danger);

  const buttonsArray: ButtonBuilder[] = [];
  // Mappare gli audio e creare un bottone per ciascuno

  const row = new ActionRowBuilder()
    .addComponents(test1, disconnectBtn);

  interaction.reply({
    // content: `Scegli un audio`,
    components: [row],
  });
}