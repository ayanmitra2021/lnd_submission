import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'marketofferings' })
export class MarketOffering {
  @PrimaryGeneratedColumn()
  marketofferingid: number;

  @Column({ type: 'varchar', length: 2000, unique: true })
  marketofferingname: string;

  @Column({ type: 'text', nullable: true })
  marketofferingdescription?: string;
}
