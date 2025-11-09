module.exports = {
  apps: [
    {
      name: "skoolelite-dashboard",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/my-smartgymapi",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
