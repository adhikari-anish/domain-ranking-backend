import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RankingModule } from './ranking/ranking.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('DATABASE_URL') ?? '';
        const u = new URL(raw);

        // Remove problematic params for node/pg
        // u.searchParams.delete('channel_binding');

        const username = decodeURIComponent(u.username);
        const password = decodeURIComponent(u.password);
        const host = u.hostname;
        const port = u.port ? Number(u.port) : 5432;
        const database = u.pathname.replace('/', ''); // "neondb"

        console.log('DB host:', host);
        console.log('DB name:', database);

        return {
          dialect: 'postgres',
          host,
          port,
          username,
          password,
          database,
          autoLoadModels: true,
          synchronize: true,
          logging: false,
          dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false },
          },
        };
      },
    }),

    RankingModule,
    HealthModule,
  ],
})
export class AppModule {}
