import * as fs from 'fs';
import * as path from 'path';
// const configLocation = process.env.CONFIG_PATH || 'config.json';

export const args = process.argv;
//export const isProd = process.argv[3] == 'PROD';i
export const isProd = process.env.NODE_ENV === 'PROD';

const baseDir = __dirname.includes('dist')
  ? path.resolve(__dirname, '..', '..') // go back to backend root from dist/app
  : process.cwd();

const configPath = isProd
  ? path.join(baseDir, 'config.prod.json')
  : path.join(baseDir, 'config.json');

if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found at: ${configPath}`);
} else {
  console.log(`✅ Loaded config from: ${configPath}`);
}
console.log('configPath =', configPath);
console.log('isDirectory?', fs.existsSync(configPath) && fs.statSync(configPath).isDirectory());
if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found at: ${configPath}`);
  process.exit(1);
}
export const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export const serviceConfig = config.serviceConfig;
export const corsClientHostHttp = config.corsClientHostHttp;
export const corsClientHostHttps = config.corsClientHostHttps;
export const corsHostHttp = config.corsHostHttp;
export const corsHostHttps = config.corsHostHttps;
export const corsClientShortHostHttp = config.corsClientShortHostHttp;
export const mongoDBConnectionString = config.mongoConnection;
export const mongoDBCloudConnectionString = config.mongoCloudConnection;
export const cloudDBName = config.cloudDBName;
export const methodsLine =
  'GET, POST, UPDATE, PUT, PATCH, DELETE, OPTIONS, HEAD';
export const headersLine =
  'Accept, Access-Control-Allow-Origin, Access-Control-Expose-Headers, Access-Control-Allow-Request-Method, Origin, X-Requested-With, Content-Type, Accept-Encoding, Content-Length';
export const jwtSecret = config.secret;
export const baseUrl = !isProd
  ? serviceConfig.appUIUrl
  : "https://talemistry.com";

export const whiteList = [
  corsClientHostHttp,
  corsClientHostHttps,
  corsHostHttp,
  corsHostHttps,
  "http://talemistry.com",
  "https://talemistry.com",
  "http://tap.talemistry.com",
  "https://tap.talemistry.com",
  "http://tab.talemistry.com",
  "https://tab.talemistry.com",
  "http://talemistry.com/api",
  "https://talemistry.com/api",
  "http://tap.talemistry.com/api",
  "https://tap.talemistry.com/api",
  "http://localhost:4200",
  "http://localhost:4300"
];

export const methods = [
  'GET',
  'POST',
  'DELETE',
  'UPDATE',
  'PUT',
  'PATCH',
  'OPTIONS',
  'HEAD',
];

export const exposedHeaders = ['Transfer-Encoding', 'Content-Disposition', 'Content-Length'];

export const headers = [
  'Accept',
  'Access-Control-Allow-Origin',
  'Access-Control-Expose-Headers',
  'Access-Control-Allow-Request-Method',
  'Connection',
  'Content-Encoding',
  'Origin',
  'X-CustomHeader',
  'Keep-Alive',
  'User-Agent',
  'X-Requested-With',
  'Content-Type',
  'Cross-Origin',
  'Transfer-Encoding',
  'Accept-Encoding',
  'Authorization',
  'Content-Length',
];
