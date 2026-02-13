import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class AuthLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  success: boolean;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ type: 'int' })
  latency: number; // in ms

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  tokenType: string; // 'access' or 'manual'
}
