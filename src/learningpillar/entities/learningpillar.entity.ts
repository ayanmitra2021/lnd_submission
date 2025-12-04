import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MarketOffering } from '../../marketoffering/entities/marketoffering.entity';

@Entity({ name: 'learningpillars' })
@Index(['marketofferingid', 'learningpillarname'], { unique: true })
export class LearningPillar {
  @PrimaryGeneratedColumn()
  learningpillarid: number;

  @Column({ type: 'bigint' })
  marketofferingid: number;

  @Column({ type: 'varchar', length: 2000 })
  learningpillarname: string;

  @Column({ type: 'text', nullable: true })
  learningpillardescription?: string;

  @ManyToOne(() => MarketOffering)
  @JoinColumn({ name: 'marketofferingid' })
  marketOffering: MarketOffering;
}
