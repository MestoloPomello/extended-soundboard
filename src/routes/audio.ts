import { getGuildInstance } from "../handlers/connections";
import { createAudioResource } from "@discordjs/voice";
import { logger } from "../classes/Logger";
import { Router } from "express";
import path from "path";

const router = Router();

router.get("/play", async (req, res) => {
	try {
		const { guildId, name } = req.query;
		const playAudioRes = await playAudio(guildId as string, name as string);
		res.status(200).send({ status: 200, message: playAudioRes });
	} catch (e) {
		logger.error("[/api/play] Error:", e);
		res.status(500).send({ status: 500, message: e as string });
	}
});

async function playAudio(
	guildId: string,
	audioName: string
): Promise<{ status: number; message: string }> {
	try {

        if (!guildId) {
            throw "manca parametro guildId";
        }

		const audioPath = path.join(process.cwd(), "audio", audioName);

		const resource = createAudioResource(audioPath, {
			inlineVolume: true
		});

		resource.volume?.setVolume(0.5);

		const guildInstance = getGuildInstance(guildId, false)!;
		if (!guildInstance?.player) throw "player non istanziato (serve /join)";

		guildInstance.player.play(resource);

		logger.log("[playAudio] Audio partito: " + audioName);
		return { status: 200, message: "Audio partito." };
	} catch (e) {
		logger.error("[playAudio] Error:", e);
		return { status: 500, message: e as string };
	}
}

export default router;