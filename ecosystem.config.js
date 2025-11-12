module.exports = {
  apps: [
    {
      name: "express-app",
      script: "node",
      args: "dist/server.js",
      cwd: "/home/ubuntu/my-smartgymapi",
      instances: 1,
      exec_mode: "fork", // simpler for small servers
      autorestart: true,
      watch: false,
      node_args: "--max-old-space-size=4096", // allocate more memory
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
