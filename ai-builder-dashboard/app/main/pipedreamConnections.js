const { BrowserWindow } = require('electron');
const axios = require('axios');
const crypto = require('crypto');
const keychain = require('./keychain');

const SUPPORTED_INTEGRATIONS = [
  { id: 'discord', name: 'Discord', description: 'Send messages to channels and manage bots.' },
  { id: 'slack', name: 'Slack', description: 'Post updates to Slack workspaces.' },
  { id: 'notion', name: 'Notion', description: 'Update databases, pages, and notes.' },
  { id: 'gmail', name: 'Gmail', description: 'Send automated emails via Gmail.' },
  { id: 'google-drive', name: 'Google Drive', description: 'Manage files in Google Drive folders.' },
  { id: 'github', name: 'GitHub', description: 'Create issues, PRs, and manage repositories.' },
];

function getCredentialKey(id) {
  return `integration-${id}`;
}

async function listIntegrations() {
  const integrations = [];
  for (const integration of SUPPORTED_INTEGRATIONS) {
    const token = await keychain.getCredential(getCredentialKey(integration.id));
    integrations.push({
      ...integration,
      connected: Boolean(token),
    });
  }
  return integrations;
}

async function authorizeIntegration(integrationId, shell) {
  const clientId = process.env.PIPEDREAM_CLIENT_ID;
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  const redirectUri = 'https://oauth.pipedream.com/integrations/callback';

  if (!clientId || !clientSecret) {
    return {
      success: false,
      message: 'Missing Pipedream OAuth credentials. Set PIPEDREAM_CLIENT_ID and PIPEDREAM_CLIENT_SECRET.',
    };
  }

  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = `https://oauth.pipedream.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=offline&state=${state}&integration=${integrationId}`;

  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(authUrl);

    const { webContents } = authWindow;

    function cleanup(result) {
      webContents.removeAllListeners('will-redirect');
      webContents.removeAllListeners('will-navigate');
      authWindow.close();
      resolve(result);
    }

    webContents.on('will-redirect', async (event, url) => {
      if (!url.startsWith(redirectUri)) {
        return;
      }
      event.preventDefault();
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const returnedState = urlObj.searchParams.get('state');

      if (!code || state !== returnedState) {
        cleanup({ success: false, message: 'OAuth verification failed.' });
        return;
      }

      try {
        const tokenResponse = await axios.post(
          'https://api.pipedream.com/v1/oauth/token',
          {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const token = tokenResponse.data?.access_token;
        if (!token) {
          cleanup({ success: false, message: 'Failed to retrieve access token.' });
          return;
        }

        await keychain.saveCredential(getCredentialKey(integrationId), token);
        cleanup({ success: true, message: `${integrationId} connected successfully.` });
      } catch (error) {
        cleanup({ success: false, message: `OAuth exchange failed: ${error.message}` });
      }
    });

    webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('https://oauth.pipedream.com/logout')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    authWindow.on('closed', () => {
      resolve({ success: false, message: 'OAuth window closed before completion.' });
    });
  });
}

async function testIntegration(integrationId) {
  const token = await keychain.getCredential(getCredentialKey(integrationId));
  if (!token) {
    return { success: false, message: 'Integration is not connected.' };
  }
  try {
    const response = await axios.get('https://api.pipedream.com/v1/sources', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (Array.isArray(response.data?.data)) {
      return { success: true, message: 'Connection verified via Pipedream API.' };
    }
    return { success: false, message: 'Unexpected API response from Pipedream.' };
  } catch (error) {
    return { success: false, message: `Failed to verify integration: ${error.message}` };
  }
}

module.exports = {
  listIntegrations,
  authorizeIntegration,
  testIntegration,
};
