import 'dotenv/config';
import net from 'net';
import path from 'path';
import fs from 'fs';

let embeddedInstance: any = null;

const isPortOpen = (port: number, host = '127.0.0.1', timeout = 1000): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
};

export const ensureLocalPostgres = async (): Promise<boolean> => {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mindgarten';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  if (!isLocal) {
    // Remote database (e.g. CasaOS IP)
    return false;
  }

  // Check if PostgreSQL is already running on port 5432
  const alreadyRunning = await isPortOpen(5432);
  if (alreadyRunning) {
    return false;
  }

  console.log('⚡ [MindGarten] PostgreSQL não detectado na porta 5432.');
  console.log('📦 [MindGarten] Iniciando PostgreSQL local embutido para testes...');

  try {
    const { default: EmbeddedPostgres } = await import('embedded-postgres');
    const dataDir = path.resolve(process.cwd(), 'data', 'postgres');

    const pg = new EmbeddedPostgres({
      databaseDir: dataDir,
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      persistent: true,
    });

    const isInitialized = fs.existsSync(path.join(dataDir, 'PG_VERSION'));
    if (!isInitialized) {
      console.log('🔧 [MindGarten] Inicializando cluster PostgreSQL local...');
      await pg.initialise();
    }

    await pg.start();
    console.log('✅ [MindGarten] PostgreSQL local iniciado com sucesso em 127.0.0.1:5432');

    // Create database if needed
    try {
      await pg.createDatabase('mindgarten');
      console.log('📁 [MindGarten] Banco de dados "mindgarten" criado.');
    } catch {
      // Database probably already exists, which is fine
    }

    embeddedInstance = pg;
    return true;
  } catch (error) {
    console.error('❌ [MindGarten] Falha ao iniciar PostgreSQL local embutido:', error);
    return false;
  }
};

export const stopLocalPostgres = async () => {
  if (embeddedInstance) {
    try {
      console.log('🛑 [MindGarten] Parando PostgreSQL local...');
      await embeddedInstance.stop();
      console.log('✅ [MindGarten] PostgreSQL local parado.');
    } catch (err) {
      console.error('Erro ao parar PostgreSQL local:', err);
    } finally {
      embeddedInstance = null;
    }
  }
};
