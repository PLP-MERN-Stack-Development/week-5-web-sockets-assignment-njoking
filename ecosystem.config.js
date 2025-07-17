// week-5-web-sockets-assignment-njoking/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "chat-server",
      script: "pnpm",
      args: "start",
      cwd: "./server",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        CLIENT_URL: "http://localhost:3000",
        SOCKET_PATH: "/socket.io"
      },
      error_file: "./logs/server-err.log",
      out_file: "./logs/server-out.log",
      merge_logs: true,
      time: true
    },
    {
      name: "chat-client",
      script: "serve",
      args: "-s dist -l 3000",
      cwd: "./client",
      env: {
        NODE_ENV: "production"
      },
      error_file: "./logs/client-err.log",
      out_file: "./logs/client-out.log"
    }
  ]
};