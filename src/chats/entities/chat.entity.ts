import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Message } from 'src/message/entities/message.entity';
import { Article } from 'src/article/entities/article.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity('chatstruequemania')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_one_id' })
  user_one: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_two_id' })
  user_two: User;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Article;

  @ManyToOne(() => Article, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'articulo_dos_id' })
  articulo_dos?: Article;

  @Column({ type: 'varchar', length: 255 })
  nameChange: string;

  @Column({ type: 'enum', enum: ['none', 'pending', 'accepted', 'rejected'], default: 'none' })
  cancel_status: 'none' | 'pending' | 'accepted' | 'rejected';

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cancel_requester_id' })
  cancel_requester?: User;

  @Column({ type: 'text', nullable: true })
  cancel_reason?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  @OneToMany(() => Order, (order) => order.chat)
  orders: Order[];

}
