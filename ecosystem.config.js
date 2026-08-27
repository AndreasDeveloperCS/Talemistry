const packageJson = require('./package.json');

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
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
