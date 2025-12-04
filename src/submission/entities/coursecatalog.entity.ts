
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'coursecatalog' })
export class CourseCatalog {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  coursecode: string;

  @Column({ type: 'varchar', length: 100 })
  marketoffering: string;

  @Column({ type: 'varchar', length: 100 })
  learningpillar: string;

  @Column({ type: 'varchar', length: 500 })
  coursename: string;

  @Column({ type: 'varchar', length: 2000 })
  courselink: string;

  @Column('text')
  coursedescription: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  duration: number;

  @Column({ type: 'varchar', length: 200 })
  vendorplatform: string;

  @Column({ type: 'varchar', length: 50 })
  courselevel: string;

  @Column({ type: 'varchar', length: 50 })
  courseorcertification: string;

  @Column({ type: 'varchar', length: 50 })
  paidorfree: string;

  @Column('text', { nullable: true })
  keywords: string;

  @Column({ type: 'boolean', default: true })
  isactive: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdtimestamp: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastmodifiedtimestamp: Date;
}
