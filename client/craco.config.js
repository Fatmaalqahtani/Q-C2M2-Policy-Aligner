// client/craco.config.js

module.exports = {
    devServer: (devServerConfig) => {
      return {
        ...devServerConfig,
        allowedHosts: ["localhost"], // or use ["all"] if accessing via IP
      };
    },
  };
  