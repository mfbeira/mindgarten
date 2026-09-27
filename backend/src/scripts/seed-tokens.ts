import { prisma } from '../db/prisma.js';

async function main() {
  console.log('🔑 Semeando tokens de agentes no banco...');

  const hermesToken = await prisma.apiToken.upsert({
    where: { token: 'hermes-agent-token' },
    update: { name: 'hermes' },
    create: {
      token: 'hermes-agent-token',
      name: 'hermes',
    },
  });

  const piToken = await prisma.apiToken.upsert({
    where: { token: 'pi-agent-token' },
    update: { name: 'pi-agent' },
    create: {
      token: 'pi-agent-token',
      name: 'pi-agent',
    },
  });

  console.log('✅ Tokens prontos:');
  console.log(` - Hermes:   token="${hermesToken.token}" (name="${hermesToken.name}")`);
  console.log(` - Pi Agent: token="${piToken.token}" (name="${piToken.name}")`);

  const allTokens = await prisma.apiToken.findMany();
  console.log('\nTodos os tokens cadastrados:', allTokens);
}

main()
  .catch((e) => {
    console.error('Erro ao semear tokens:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
