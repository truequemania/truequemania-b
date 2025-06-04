import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity('returnordertruequemania')
export class Returnorder {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column('text')
    motivo: string;

    @Column({ type: 'varchar', length: 100 })
    estado_producto: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    numero_contacto: string;

    @Column({ type: 'varchar', length: 50, default: 'pendiente' })
    estado: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
