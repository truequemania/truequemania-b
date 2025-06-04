import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserPlanTruequemania } from './userplantruequemania.entity';


@Entity('plantruequemania')
export class PlanTruequemania {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column()
  limite_publicaciones: number;

  @Column()
  limite_intercambios: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ default: true })
  es_activo: boolean;

  @OneToMany(() => UserPlanTruequemania, up => up.plan)
  userPlans: UserPlanTruequemania[];
}
