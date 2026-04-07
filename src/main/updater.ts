import { app, dialog, shell } from 'electron';
import * as https from 'https';

const REPO = 'matuscvengros/wake-on-lan';

interface GitHubRelease {
  tag_name: string;
  html_url: string;
}

function fetchLatestRelease(): Promise<GitHubRelease> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/releases/latest`,
      headers: { 'User-Agent': 'wake-on-lan' },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(data) as GitHubRelease);
        } catch {
          reject(new Error('Failed to parse GitHub response'));
        }
      });
    }).on('error', reject);
  });
}

function compareVersions(current: string, latest: string): boolean {
  const cur = current.replace(/^v/, '').split('.').map(Number);
  const lat = latest.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((lat[i] || 0) > (cur[i] || 0)) return true;
    if ((lat[i] || 0) < (cur[i] || 0)) return false;
  }
  return false;
}

export async function checkForUpdates(): Promise<void> {
  try {
    const release = await fetchLatestRelease();
    const currentVersion = app.getVersion();
    const latestVersion = release.tag_name;

    if (compareVersions(currentVersion, latestVersion)) {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version (${latestVersion}) is available.`,
        detail: `You are running v${currentVersion}.`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
      });

      if (response === 0) {
        shell.openExternal(release.html_url);
      }
    }
  } catch {
    // Silently ignore update check failures
  }
}
