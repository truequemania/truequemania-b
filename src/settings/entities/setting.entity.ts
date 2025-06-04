import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settingstruequemania')
export class Setting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: false })
    maintenance_mode: boolean;
}
