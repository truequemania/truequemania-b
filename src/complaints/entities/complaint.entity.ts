import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Chat } from 'src/chats/entities/chat.entity';

@Entity('complaintstruequemania')
export class Complaint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @Column()
  motivo: string;

  @Column('text')
  descripcion: string;

  @Column({ type: 'enum', enum: ['pendiente', 'resuelto', 'rechazado'], default: 'pendiente' })
  estado: string;

  @Column({ name: 'resolucion_mensaje', type: 'text', nullable: true })
  resolucionMensaje: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
