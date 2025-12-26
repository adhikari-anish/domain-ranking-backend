import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'rankings',
  timestamps: true,
  indexes: [
    {
      name: 'rankings_domain_date_unique',
      unique: true,
      fields: ['domain', 'date'],
    },
  ],
})
export class Ranking extends Model<Ranking> {
  @Column({ type: DataType.STRING, allowNull: false })
  domain!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  date!: string; // YYYY-MM-DD

  @Column({ type: DataType.INTEGER, allowNull: false })
  rank!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  fetchedAt!: Date;
}
