import { destroyGuildInstance, getGuildInstance } from "./handlers/connections";
import { createAudioResource, getVoiceConnection } from "@discordjs/voice";
import { guildSetup, loadGuilds, saveGuilds } from "./handlers/guilds";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { listAudioFiles, updateAudioFiles } from "./handlers/audio";
import { existsSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH } from "./constants";
import { audioFiles } from "./handlers/audio";
import { engine } from "express-handlebars";
import { logger } from "./classes/Logger";
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

	logger.log("[STARTUP] Setting up guilds...");
	const promisesArray = guildsArray.map(async (guild) => {
		guildSetup({ guildObj: guild, client });
	});
	await Promise.all(promisesArray);

	await updateAudioFiles();
	await listAudioFiles();
	logger.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
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
		destroyGuildInstance(guildId);
		logger.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(interaction as ChatInputCommandInteraction);
		}
	}

	if (interaction.isButton()) {
		if (interaction.customId == "disconnectBtn") {
			destroyGuildInstance(interaction.guildId as string);
			interaction.update({
				components: []
			});
		}
	}
});

client.login(config.DISCORD_TOKEN);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.static("public"));

app.engine("handlebars", engine({
	helpers: {
		eq: (a: string, b: string) => a === b,
		hasGroup: (context: any) => context && context.data && context.data.root && context.data.root.groupByAuthor
	}
}));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname + "/views"));

app.get("/", (req, res) => {
	const sortBy = req.query.sort as string || 'name';
	const groupByAuthor = req.query.group === 'true';

	const processedFiles = audioFiles.map((e) => {
		const authorMatch = e.name.match(/^\[(.+?)\]/);
		const authors = authorMatch 
			? authorMatch[1].split(/\s+/).map(a => a.toUpperCase())
			: null;
		const nameWithoutExtension = e.name.substring(0, e.name.lastIndexOf("."));
		const displayName = authors 
			? nameWithoutExtension.replace(/^\[.+?\]\s*/, '')
			: nameWithoutExtension;

		return {
			...e,
			authors,
			fullName: nameWithoutExtension.toLowerCase().replaceAll("_", " "),
			formattedName: displayName.toLowerCase().replaceAll("_", " ")
		};
	});

	if (groupByAuthor) {
		const grouped = new Map<string, typeof processedFiles>();

		processedFiles.forEach(file => {
			if (file.authors && file.authors.length > 0) {
				file.authors.forEach(author => {
					if (!grouped.has(author)) {
						grouped.set(author, []);
					}
					grouped.get(author)!.push(file);
				});
			} else {
				const authorKey = 'SENZA AUTORE';
				if (!grouped.has(authorKey)) {
					grouped.set(authorKey, []);
				}
				grouped.get(authorKey)!.push(file);
			}
		});

		const sections = Array.from(grouped.entries())
		.map(([author, files]) => {
			if (sortBy === 'date') {
				files.sort((a, b) => b.birthtime.getTime() - a.birthtime.getTime());
			} else {
				files.sort((a, b) => a.formattedName.localeCompare(b.formattedName));
			}
			return { author, files, count: files.length };
		})
		.sort((a, b) => a.author.localeCompare(b.author));

		res.render("index", {
			sections,
			currentSort: sortBy,
			groupByAuthor: true
		});
	} else {
		let sortedFiles = [...processedFiles];
		if (sortBy === 'date') {
			sortedFiles.sort((a, b) => b.birthtime.getTime() - a.birthtime.getTime());
		} else {
			sortedFiles.sort((a, b) => a.fullName.localeCompare(b.fullName));
		}

		res.render("index", {
			audioFiles: sortedFiles,
			currentSort: sortBy,
			groupByAuthor: false
		});
	}
});

app.get("/api/play", async (req, res) => {
	try {
		const { guildId, name } = req.query;
		const playAudioRes = await playAudio(guildId as string, name as string);
		res.status(200).send({ status: 200, message: playAudioRes });
	} catch (e) {
		logger.error("[/api/play] Error:", e);
		res.status(500).send({ status: 500, message: e as string });
	}
});

app.listen(PORT, "0.0.0.0", () => {
	logger.log("Extended Soundboard server started.");
});

async function playAudio(
	guildId: string,
	audioName: string
): Promise<{ status: number; message: string }> {
	try {
		const audioPath = path.join(process.cwd(), "audio", audioName);

		const resource = createAudioResource(audioPath, {
			inlineVolume: true
		});

		resource.volume?.setVolume(0.5);

		const guildInstance = getGuildInstance(guildId, false)!;
		if (!guildInstance.player) throw "player non istanziato (serve /join)";

		guildInstance.player.play(resource);

		logger.log("[playAudio] Audio partito: " + audioName);
		return { status: 200, message: "Audio partito." };
	} catch (e) {
		logger.error("[playAudio] Error:", e);
		return { status: 500, message: e as string };
	}
}
