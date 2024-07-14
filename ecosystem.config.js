module.exports = {
  apps: [
    {
      name: 'reddit-viewer.com', // Name of the app.
      script: 'npm', // Specifies the script runner.
      args: 'start', // Specifies the script to run.
      instances: 2, // Can be scaled up if needed.
      autorestart: true, // Automatically restart if the app crashes.
      watch: false, // Turned off in production to avoid unintentional restarts.
      max_memory_restart: '1G', // Restart the app if it reaches the memory limit.
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
}
