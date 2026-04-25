module.exports = {
  apps: [
    {
      name: "pqt-aftersales",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/pqt-aftersales",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
