import { Injectable } from '@nestjs/common';
import { CreatePaypalDto } from './dto/create-paypal.dto';
import { UpdatePaypalDto } from './dto/update-paypal.dto';
import { URL_BACKEND, URL_FRONTEND } from 'src/url';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPlanTruequemania } from './entities/userplantruequemania.entity';
import { PlanTruequemania } from './entities/plantruequemania.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PaypalService {
  constructor(
    @InjectRepository(UserPlanTruequemania)
    private readonly userPlanRepo: Repository<UserPlanTruequemania>,
    @InjectRepository(PlanTruequemania)
    private readonly planRepo: Repository<PlanTruequemania>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createPayment(email: string, plan: string) {
    // Buscar el usuario y su plan activo
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error('Usuario no encontrado');
    const now = new Date();
    const userPlan = await this.userPlanRepo.findOne({
      where: { user: { id: user.id }, es_activo: true },
      order: { fecha_inicio: 'DESC' },
    });
    if (userPlan && userPlan.fecha_fin && new Date(userPlan.fecha_fin) > now) {
      throw new Error('Ya tienes un plan activo. Espera a que expire para comprar otro.');
    }
    // Buscar el plan y su precio, si no existe usar precio por defecto
    let value: number;
    let planDb = null;
    if (plan === 'Pro') {
      value = 9.99;
    } else if (plan === 'Empresarial') {
      value = 29.99;
    } else {
      planDb = await this.planRepo.findOne({ where: { nombre: plan, es_activo: true } });
      if (planDb) {
        value = Number(planDb.precio);
      } else {
        value = 9.99;
      }
    }
    // Continuar con el flujo normal de pago
    // Asegurarse de que el plan se pase en la URL de retorno
    const return_url = `${URL_BACKEND}/paypal/capture?email=${email}&plan=${encodeURIComponent(plan)}`;
    try {
      const order = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value,
            },
          },
        ],
        application_context: {
          brand_name: 'Truequemania',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url,
          cancel_url: `${URL_FRONTEND}/planes`,
        },
      };

      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');

      const { data: { access_token } } = await axios.post(
        process.env.URL_PAYPAL_TOKEN,
        params,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: {
            username: process.env.CLIENT_PAYPAL_ID,
            password: process.env.SECRET_PAYPAL_ID,
          },
        },
      );

      const { data } = await axios.post(
        process.env.URL_PAYPAL_ORDERS,
        order,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const approvalLink = data.links.find(link => link.rel === "approve");
      return { approvalUrl: approvalLink?.href, message: planDb ? undefined : 'Plan no encontrado, usando precio por defecto.' };
    } catch (error) {
      // Mejorar el mensaje de error para el frontend
      let msg = 'Error al crear la orden en PayPal';
      if (error instanceof Error && error.message) {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      } else if (error?.response?.data?.message) {
        msg = error.response.data.message;
      }
      throw new Error(msg);
    }
  }

  async capturePayment(token: string, data: { email: string, plan?: string }) {
    const { email, plan } = data;
    await axios.post(
      `${process.env.URL_PAYPAL_ORDERS}/${token}/capture`,
      {},
      {
        auth: {
          username: process.env.CLIENT_PAYPAL_ID,
          password: process.env.SECRET_PAYPAL_ID,
        },
      }
    );
    // Registrar el plan solo si se recibe el nombre del plan
    if (plan) {
      const user = await this.userRepo.findOne({ where: { email } });
      let planDb = await this.planRepo.findOne({ where: { nombre: plan, es_activo: true } });
      // Si no existe el plan en la base de datos, crearlo en caliente (solo para Pro o Empresarial)
      if (!planDb && (plan === 'Pro' || plan === 'Empresarial')) {
        planDb = await this.planRepo.save({
          nombre: plan,
          descripcion: plan === 'Pro' ? 'Plan Pro autogenerado' : 'Plan Empresarial autogenerado',
          limite_publicaciones: plan === 'Pro' ? 5 : 15,
          limite_intercambios: 9999,
          precio: plan === 'Pro' ? 9.99 : 29.99,
          es_activo: true,
        });
      }
      if (user && planDb) {
        // Desactivar planes anteriores activos
        await this.userPlanRepo.update({ user: { id: user.id }, es_activo: true }, { es_activo: false });
        const fecha_inicio = new Date();
        const fecha_fin = new Date(fecha_inicio.getTime() + 30 * 24 * 60 * 60 * 1000);
        await this.userPlanRepo.save({
          user,
          plan: planDb,
          fecha_inicio,
          fecha_fin,
          es_activo: true,
        });
      }
    }
  }

}
