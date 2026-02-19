module.exports = {
  apps: [
    {
      name: 'mail-to-notion',
      script: 'packages/backend/dist/index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'mail-to-notion-watchdog',
      script: 'scripts/watchdog.js',
      cwd: __dirname,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 10000,
      out_file: 'logs/watchdog-pm2-out.log',
      error_file: 'logs/watchdog-pm2-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
