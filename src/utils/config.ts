import { ROKU_CONSTANTS } from './constants';
import appConfig from '../../app.config.json';

export const config = {
  appName: appConfig.appName || ROKU_CONSTANTS.APP_TITLE,
  appSubtitle: appConfig.appSubtitle || 'Enjoy your videos',
  version: appConfig.version || ROKU_CONSTANTS.MANIFEST_VERSION,
  devMode: appConfig.devMode ?? true,
  wifiCheckIntervalMs: appConfig.wifiCheckIntervalMs || 120000,
  localFeedUrl: appConfig.defaultFeedUrl || '/feeds/sample-feed.json',
  remoteFeedUrl: import.meta.env.VITE_ROKU_FEED_URL || '',
  isDebugMode: appConfig.devMode ?? true,
  autoPlayVideo: true,
};

