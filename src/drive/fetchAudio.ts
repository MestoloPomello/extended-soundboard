/**
 * Retrieves a list of audio files from the specified Google Drive folder.
 *
 * @return {Promise<{ id: string; name: string; }[]>} An array of objects containing the id and name of the audio files.
 */
export async function listAudioFiles(): Promise<{ id: string; name: string; }[]> {
    const driveID = process.env.DRIVE_ID;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files`
        + `?q=%27${driveID}%27%20in%20parents`
        + `&key=${process.env.GOOGLE_API_KEY}`,
        {
            "method": "GET"
        });
    const resJson = await res.json();
    return resJson.files.map((i: { id: any; name: any; }) => { return { id: i.id, name: i.name }});
}