import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DRIVERS_DIR = path.join(__dirname, '../backend-java/lib');

const JDBC_DRIVERS = {
  informix: {
    name: 'Informix JDBC Driver',
    className: 'com.informix.jdbc.IfxDriver',
    fileName: 'ifxjdbc.jar',
    version: '4.50.10',
    description: 'IBM Informix JDBC Driver pour connexion aux bases Informix',
    downloadUrl: 'https://repo1.maven.org/maven2/com/ibm/informix/jdbc/4.50.10/jdbc-4.50.10.jar',
    mavenCoords: 'com.ibm.informix:jdbc:4.50.10'
  },
  oracle: {
    name: 'Oracle JDBC Driver',
    className: 'oracle.jdbc.driver.OracleDriver',
    fileName: 'ojdbc8.jar',
    version: '21.9.0.0',
    description: 'Oracle JDBC Driver pour connexion aux bases Oracle',
    downloadUrl: 'https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/21.9.0.0/ojdbc8-21.9.0.0.jar',
    mavenCoords: 'com.oracle.database.jdbc:ojdbc8:21.9.0.0'
  },
  mysql: {
    name: 'MySQL JDBC Driver',
    className: 'com.mysql.cj.jdbc.Driver',
    fileName: 'mysql-connector-j.jar',
    version: '8.2.0',
    description: 'MySQL Connector/J pour connexion aux bases MySQL',
    downloadUrl: 'https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.2.0/mysql-connector-j-8.2.0.jar',
    mavenCoords: 'com.mysql:mysql-connector-j:8.2.0'
  },
  postgresql: {
    name: 'PostgreSQL JDBC Driver',
    className: 'org.postgresql.Driver',
    fileName: 'postgresql.jar',
    version: '42.7.1',
    description: 'PostgreSQL JDBC Driver pour connexion aux bases PostgreSQL',
    downloadUrl: 'https://repo1.maven.org/maven2/org/postgresql/postgresql/42.7.1/postgresql-42.7.1.jar',
    mavenCoords: 'org.postgresql:postgresql:42.7.1'
  }
};

async function ensureDriversDirectory() {
  try {
    await fs.access(DRIVERS_DIR);
  } catch {
    await fs.mkdir(DRIVERS_DIR, { recursive: true });
  }
}

async function checkDriverExists(dbType) {
  const driver = JDBC_DRIVERS[dbType];
  if (!driver) return false;

  try {
    const driverPath = path.join(DRIVERS_DIR, driver.fileName);
    await fs.access(driverPath);
    const stats = await fs.stat(driverPath);
    return {
      exists: true,
      size: stats.size,
      path: driverPath,
      lastModified: stats.mtime
    };
  } catch {
    return { exists: false };
  }
}

async function downloadDriver(dbType, onProgress) {
  const driver = JDBC_DRIVERS[dbType];
  if (!driver) {
    throw new Error(`Driver not found for database type: ${dbType}`);
  }

  await ensureDriversDirectory();

  const driverPath = path.join(DRIVERS_DIR, driver.fileName);

  try {
    const response = await axios({
      method: 'GET',
      url: driver.downloadUrl,
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
        }
      }
    });

    const writer = createWriteStream(driverPath);
    await pipeline(response.data, writer);

    return {
      success: true,
      path: driverPath,
      driver: driver
    };
  } catch (error) {
    throw new Error(`Failed to download driver: ${error.message}`);
  }
}

async function getAllDriversStatus() {
  const status = {};

  for (const [dbType, driver] of Object.entries(JDBC_DRIVERS)) {
    const exists = await checkDriverExists(dbType);
    status[dbType] = {
      ...driver,
      installed: exists.exists,
      size: exists.size,
      lastModified: exists.lastModified,
      path: exists.path
    };
  }

  return status;
}

async function deleteDriver(dbType) {
  const driver = JDBC_DRIVERS[dbType];
  if (!driver) {
    throw new Error(`Driver not found for database type: ${dbType}`);
  }

  const driverPath = path.join(DRIVERS_DIR, driver.fileName);

  try {
    await fs.unlink(driverPath);
    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, message: 'Driver was not installed' };
    }
    throw error;
  }
}

export {
  JDBC_DRIVERS,
  checkDriverExists,
  downloadDriver,
  getAllDriversStatus,
  deleteDriver,
  ensureDriversDirectory
};
