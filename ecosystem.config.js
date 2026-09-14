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
const runtimeEnv = { ...fileEnv, ...process.env };

module.exports = {
  apps: [
    {
      name: 'talemistry-web',
      version: packageJson.version,
      script: 'npm',
      args: 'run start:prod',
      cwd: __dirname,
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        ...runtimeEnv,
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
