import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class MonitorLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  method: string;

  @Column()
  statusCode: number;

  @Column()
  latency: number;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  timestamp: Date;
}
