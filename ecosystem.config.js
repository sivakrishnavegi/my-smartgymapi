
module.exports = {
  apps: [
    {
      name: "express-app",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/my-smartgymapi", // full path to your project
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
