# Extended Soundboard (Discord Bot)
![discordjs](https://img.shields.io/badge/discordjs-v14-blue)

## Environment variables
- `DISCORD_TOKEN`: from Discord Developer Portal
- `DISCORD_CLIENT_ID`: from Discord Developer Portal
- `DASHBOARD_URL`: the full exposed url for the UI (e.g. http://127.0.0.1:8080)
- `PORT`: the exposed server port (e.g. 8080)
- `MEGA_URL`: the URL for the MEGA folder in which the audios are located (put the URL in quotation marks)
- `OWNER_ID`: the Discord ID for the user who owns the bot (for special commands)
- `ADMIN_PASSWORD`: the password used for opening the admin panel.
- `SESSION_SECRET`: random secret used to generate session tokens.

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
