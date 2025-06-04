import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlanTruequemania } from './plantruequemania.entity';
import { User } from '../../users/entities/user.entity';

@Entity('userplantruequemania')
export class UserPlanTruequemania {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.id, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PlanTruequemania, plan => plan.id, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanTruequemania;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_inicio: Date;

  @Column({ type: 'datetime', nullable: true })
  fecha_fin: Date;

  @Column({ default: true })
  es_activo: boolean;
}
