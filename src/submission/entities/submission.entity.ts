import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// This is the main fix for the table name
@Entity({ name: 'practitionersubmissions' })
export class Submission {
  // Use lowercase properties to match the database columns
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  submissionid: number;

  @Column({ type: 'varchar', length: 255 })
  practitioneremail: string;

  @Column({ type: 'varchar', length: 50 })
  coursecode: string;

  @Column({ type: 'varchar', length: 255 })
  coursename: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hourscompleted: number;

  @Column({ type: 'date' })
  dateofcompletion: string;

  @Column({ type: 'uuid' })
  certificateguid: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdtimestamp: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastmodifiedtimestamp: Date;
}