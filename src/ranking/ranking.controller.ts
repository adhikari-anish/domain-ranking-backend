import { Controller, Get, Param } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get(':domains')
  async getRanking(@Param('domains') domains: string) {
    return this.rankingService.getRankings(domains);
  }
}
