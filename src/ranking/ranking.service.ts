import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Ranking } from './ranking.model';

type TrancoResponse = {
  domain: string;
  ranks: Array<{ date: string; rank: number }>;
};

@Injectable()
export class RankingService {
  private readonly cacheHours: number;
  private readonly trancoBaseUrl: string;

  constructor(
    @InjectModel(Ranking) private rankingModel: typeof Ranking,
    private config: ConfigService,
    private http: HttpService,
  ) {
    this.cacheHours = Number(this.config.get('CACHE_HOURS') ?? 24);
    this.trancoBaseUrl = String(
      this.config.get('TRANCO_BASE_URL') ?? 'https://tranco-list.eu/api/ranks',
    );
  }

  private normalizeDomain(input: string): string {
    // remove protocol, path, www, lower-case
    let d = input.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, '');
    d = d.split('/')[0];
    d = d.replace(/^www\./, '');
    return d;
  }

  private isFreshFetchedAt(fetchedAt: string | Date): boolean {
    const t = new Date(fetchedAt).getTime();
    const diffHours = (Date.now() - t) / (1000 * 60 * 60);
    return diffHours < this.cacheHours;
  }

  async getRankings(domainsRaw: string) {
    const domains = domainsRaw
      .split(',')
      .map((d) => this.normalizeDomain(d))
      .filter(Boolean);

    // de-dupe while keeping order
    const seen = new Set<string>();
    const uniqueDomains = domains.filter((d) =>
      seen.has(d) ? false : seen.add(d),
    );

    const results = await Promise.all(
      uniqueDomains.map((domain) => this.getSingleDomain(domain)),
    );

    return { domains: results };
  }

  private async getSingleDomain(domain: string) {
    // Find most recent cached date
    const latestRow = await this.rankingModel.findOne({
      where: { domain },
      order: [['fetchedAt', 'DESC']],
      attributes: ['fetchedAt'],
      raw: true,
    });

    if (latestRow?.fetchedAt && this.isFreshFetchedAt(latestRow.fetchedAt)) {
      const cached = await this.rankingModel.findAll({
        where: { domain },
        order: [['date', 'ASC']],
        attributes: ['date', 'rank'],
        raw: true,
      });

      return {
        domain,
        ranks: cached.map((r) => ({ date: r.date, rank: r.rank })),
        source: 'cache',
      };
    }

    // Fetch from Tranco
    const url = `${this.trancoBaseUrl}/${encodeURIComponent(domain)}`;
    const { data } = await firstValueFrom(this.http.get<TrancoResponse>(url));

    // Replace rows for that domain
    await this.rankingModel.destroy({ where: { domain } });

    if (data?.ranks?.length) {
      const now = new Date();
      await this.rankingModel.bulkCreate(
        data.ranks.map((p) => ({
          domain,
          date: p.date,
          rank: p.rank,
          fetchedAt: now,
        })) as unknown as any[],
      );
    }

    return {
      domain,
      ranks: (data?.ranks ?? []).map((p) => ({ date: p.date, rank: p.rank })),
      source: 'tranco',
    };
  }
}
