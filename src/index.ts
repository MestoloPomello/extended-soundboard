require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { listAudioFiles, updateAudioFiles, player } from "./drive/audio";
import { join } from "node:path";
import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { audioFiles } from "./drive/audio";
import { createAudioResource, getVoiceConnection } from "@discordjs/voice";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
	deployCommands({ guildId: process.env.DEFAULT_GUILD! });
	await listAudioFiles();
	await updateAudioFiles();
	console.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
	await deployCommands({ guildId: guild.id });
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	const guildId = oldState.guild.id;
	const myConn = getVoiceConnection(guildId);

	if (
		myConn &&
			myConn.joinConfig.channelId == oldState.channelId &&
			myConn.joinConfig.channelId != newState.channelId &&
			oldState.channel?.members.size == 1
	) {
		myConn.destroy();
		console.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	// Slash commands handlers
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(interaction);
		}
	}

	// Button handlers
	if (interaction.isButton()) {
		if (interaction.customId == "disconnectBtn") {
			getVoiceConnection(interaction.guildId as string)?.destroy();
			//interaction.reply("Disconnesso dal canale.");
			interaction.update({
				components: []
			});

		}
		//else {
		//     playAudio(interaction.guildId!, interaction.customId);
		//     interaction.deferUpdate();
		//   }
	}
});

client.login(config.DISCORD_TOKEN);

// Express server
const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.static("public"));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname + "/views"));
app.get("/", (req, res) => {
	res.render("index", {
		audioFiles: audioFiles.map((e) => {
			return {
				...e,
				formattedName: e.name
				.toLowerCase()
				.replace(".m4a", "")
				.replace(".mp3", "")
				.replaceAll("_", " "),
			};
		}),
	});
});

app.get("/api/play", async (req, res) => {
	try {
		const { guildId, name } = req.query;
		const playAudioRes = await playAudio(guildId as string, name as string);
		res.status(200).send({ status: 200, message: playAudioRes });
	} catch (e) {
		console.error("API play - Error:", e);
		res.status(500).send({ status: 500, message: e as string });
	}
});

// Railway needs 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
	console.log("Extended Soundboard server started.");
});

// Local functions

async function playAudio(
	guildId: string,
	audioName: string
): Promise<{ status: number; message: string }> {
	try {
		// const voiceConnection = getVoiceConnection(guildId as string);
		const path = join(__dirname, "../audio/", audioName);
		const resource = createAudioResource(path);

		if (!player) throw "player non istanziato (serve /join)";

		player.play(resource);

		console.log("Audio partito: " + audioName);
		return { status: 200, message: "Audio partito." };
	} catch (e) {
		console.error("playAudio - Error:", e);
		return { status: 500, message: e as string };
	}
}
