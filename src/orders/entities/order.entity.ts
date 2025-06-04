import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Chat } from 'src/chats/entities/chat.entity';

@Entity('orderstruequemania')
export class Order {
    
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Chat)
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;

    @Column({ type: 'enum', enum: ['pending', 'accepted', 'declined'], default: 'pending' })
    status: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'requester_id' })
    requester: User;

    @Column({ type: 'text', nullable: true })
    decline_reason: string;

    @Column({ type: 'enum', enum: ['pendiente', 'enviado'], default: 'pendiente' })
    status_envio: string;

    @CreateDateColumn()
    created_at: Date;
}
