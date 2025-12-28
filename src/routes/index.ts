import { audioFiles } from "../handlers/audio";
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
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

export default router;