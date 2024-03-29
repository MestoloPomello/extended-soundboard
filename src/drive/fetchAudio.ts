/**
 * Retrieves a list of audio files from the specified Google Drive folder.
 *
 * @return {Promise<{ id: string; name: string; }[]>} An array of objects containing the id and name of the audio files.
 */
export async function listAudioFiles(): Promise<{ id: string; name: string; }[]> {
    const driveID = process.env.DRIVE_ID;
    let fullFiles: any[] = [];
    let resJson, pageToken;
    do {
        const res: any = await fetch(`https://www.googleapis.com/drive/v3/files`
            + `?q=%27${driveID}%27%20in%20parents`
            + `&key=${process.env.GOOGLE_API_KEY}`
            + (pageToken ? `&pageToken=${pageToken}` : ""),
            {
                "method": "GET"
            });
        resJson = await res.json();
        fullFiles = fullFiles.concat(resJson.files);
        pageToken = resJson.nextPageToken;
    } while (resJson.nextPageToken);

    return fullFiles.map((i: { id: any; name: any; }) => { return { id: i.id, name: i.name } });
}