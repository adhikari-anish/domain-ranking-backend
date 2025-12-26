import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { Ranking } from './ranking.model';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [HttpModule, SequelizeModule.forFeature([Ranking])],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}
