import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class MonitorLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  path: string;

  @Index()
  @Column({ nullable: true })
  deviceId: string;

  @Column()
  method: string;

  @Column()
  statusCode: number;

  @Column()
  latency: number;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationResult: any;

  @Column({ type: 'text', nullable: true })
  validationError: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'jsonb', nullable: true })
  responseData: any;

  @Column({ type: 'jsonb', nullable: true })
  requestData: any;

  @Index()
  @CreateDateColumn()
  timestamp: Date;
}
