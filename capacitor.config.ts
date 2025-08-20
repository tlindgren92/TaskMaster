import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.esga.taskmaster',
  appName: 'TaskMaster',
  webDir: 'dist/todo-app/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;


