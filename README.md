# Extended Soundboard (Discord Bot)
![discordjs](https://img.shields.io/badge/discordjs-v14-blue)

## Environment variables
- `DISCORD_TOKEN`: from Discord Developer Portal
- `DISCORD_CLIENT_ID`: from Discord Developer Portal
- `DRIVE_ID`: for the Google Drive where the audio files are stored
- `GOOGLE_API_KEY`: from a Google Cloud Platform project for which the Google Drive API is active
- `DEFAULT_GUILD`: default Discord guild ID
- `DASHBOARD_URL`: the full exposed url for the UI (e.g. http://127.0.0.1:8080)
- `PORT`: the exposed server port (e.g. 8080)

---

## Github Action for deployment
The bot is currently deployed when a new release is created.

### Github Secrets
The current configuration works for Debian.
- `VPS_HOST`
- `VPS_PORT`
- `VPS_USERNAME`
- `VPS_SSH_KEY`: generated on the VPS

### Other requirements
- `npm` and `PM2` installed on the VPS
