const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('inkfra', {
  platform: process.platform,
})
