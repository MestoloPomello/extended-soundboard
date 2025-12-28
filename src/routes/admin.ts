import { getPaginatedAudioFiles, refreshAudioFile, deleteLocalAudioFile, formatFileSize } from "../handlers/admin";
import { Router, Request, Response, NextFunction } from "express";
import { logger } from "../classes/Logger";

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Middleware to check admin authentication
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
	// @ts-ignore
	if (req.session && req.session.isAdmin) {
		next();
	} else {
		res.status(401).json({ error: "Non autenticato" });
	}
}

// Admin panel page
router.get("/", (req, res) => {
	res.render("admin", {
		layout: "admin"
	});
});

// Admin login endpoint
router.post("/login", (req, res) => {
	try {
		const { password } = req.body;
		
		if (password === ADMIN_PASSWORD) {
			// @ts-ignore
			req.session.isAdmin = true;
			res.json({ success: true });
		} else {
			res.status(401).json({ error: "Password errata" });
		}
	} catch (error) {
		logger.error("[POST /api/admin/login] Error:", error);
		res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
	}
});

// Admin logout endpoint
router.post("/logout", (req, res) => {
	// @ts-ignore
	req.session.destroy((err) => {
		if (err) {
			logger.error("[POST /api/admin/logout] Error:", err);
			res.status(500).json({ error: "Errore durante il logout" });
		} else {
			res.json({ success: true });
		}
	});
});

// Check admin auth status
router.get("/check-auth", (req, res) => {
	// @ts-ignore
	res.json({ isAuthenticated: !!req.session?.isAdmin });
});

// Get paginated audio files
router.get("/files", requireAdminAuth, (req, res) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const pageSize = parseInt(req.query.pageSize as string) || 50;
		const search = (req.query.search as string) || "";

		const result = getPaginatedAudioFiles(page, pageSize, search);
		
		const filesWithFormattedSize = result.files.map(f => ({
			...f,
			formattedSize: formatFileSize(f.size)
		}));

		res.json({
			...result,
			files: filesWithFormattedSize
		});
	} catch (error) {
		logger.error("[GET /api/admin/files] Error:", error);
		res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
	}
});

// Refresh audio file from MEGA
router.post("/refresh", requireAdminAuth, async (req, res) => {
	try {
		const { fileName } = req.body;
		
		if (!fileName) {
			return res.status(400).json({ error: "fileName è richiesto" });
		}

		await refreshAudioFile(fileName);
		res.json({ success: true, message: `File ${fileName} aggiornato con successo` });
	} catch (error) {
		logger.error("[POST /api/admin/refresh] Error:", error);
		res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
	}
});

// Delete local audio file
router.delete("/delete", requireAdminAuth, async (req, res) => {
	try {
		const { fileName } = req.body;
		
		if (!fileName) {
			return res.status(400).json({ error: "fileName è richiesto" });
		}

		await deleteLocalAudioFile(fileName);
		res.json({ success: true, message: `File ${fileName} eliminato con successo` });
	} catch (error) {
		logger.error("[DELETE /api/admin/delete] Error:", error);
		res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
	}
});

export default router;