require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { ChatInputCommandInteraction, Client } from "discord.js";
import { createAudioResource, getVoiceConnection } from "@discordjs/voice";
import { listAudioFiles, player, updateAudioFiles } from "./mega/audio";
import { guildSetup, loadGuilds, saveGuilds } from "./guild-setup";
import { existsSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH } from "./constants";
import { engine } from "express-handlebars";
import { audioFiles } from "./mega/audio";
import { commands } from "./commands";
import { SavedGuild } from "./types";
import { config } from "./config";
import express from "express";
import path from "path";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("clientReady", async () => {

    if (!existsSync(GUILDS_LIST_PATH)) {
        writeFileSync(GUILDS_LIST_PATH, "[]");
    }
    const guildsArray: SavedGuild[] = loadGuilds();

    // Guilds setup
    console.log("[STARTUP] Setting up guilds...");
    const promisesArray = guildsArray.map(async (guild) => {
        guildSetup({ guildObj: guild, client });
    });
    await Promise.all(promisesArray);

    await updateAudioFiles();
    await listAudioFiles();
	console.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
    // Add the server to the list (its ID will be used to refresh commands)
	const guildsArray: SavedGuild[] = loadGuilds();
    const newGuild = { id: guild.id, status: "" };
	guildsArray.push(newGuild);
    saveGuilds(guildsArray);
    guildSetup({ guildObj: newGuild });
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
			commands[commandName as keyof typeof commands].execute(interaction as ChatInputCommandInteraction);
		}
	}

	// Button handlers
	if (interaction.isButton()) {
		if (interaction.customId == "disconnectBtn") {
			getVoiceConnection(interaction.guildId as string)?.destroy();
			interaction.update({
				components: []
			});
		}
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
		const audioPath = path.join(process.cwd(), "audio", audioName);
		const resource = createAudioResource(audioPath);

		if (!player) throw "player non istanziato (serve /join)";

		player.play(resource);

		console.log("[playAudio] Audio partito: " + audioName);
		return { status: 200, message: "Audio partito." };
	} catch (e) {
		console.error("[playAudio] Error:", e);
		return { status: 500, message: e as string };
	}
}
