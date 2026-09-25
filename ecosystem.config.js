const packageJson = require('./package.json');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator < 1) return null;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
      .filter(Boolean),
  );
}

const fileEnv = loadEnvFile(path.join(__dirname, '.env'));
// Ignore empty process.env values (e.g. an unset GitHub Actions secret) so they
// never override a value that is configured in the server-side .env file.
const processEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => typeof value === 'string' && value.length > 0),
);
const runtimeEnv = { ...fileEnv, ...processEnv };

module.exports = {
  apps: [
    {
      name: 'talemistry-web',
      version: packageJson.version,
      // Run the Next.js binary directly: wrapping npm leaves an orphaned
      // next-server child holding port 3000 whenever PM2 stops/deletes the app.
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      kill_timeout: 5000,
      env: {
        ...runtimeEnv,
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
