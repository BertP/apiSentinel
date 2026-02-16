
import { createConnection } from 'typeorm';
import { MonitorLog } from '../monitor/entities/monitor-log.entity';

async function cleanup() {
    const connection = await createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'api_sentinel',
        entities: [MonitorLog],
        synchronize: false,
    });

    const repo = connection.getRepository(MonitorLog);
    await repo.clear();

    console.log(`Cleared all log entries.`);
    await connection.close();
}

cleanup().catch(console.error);
