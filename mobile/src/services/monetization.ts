import api from "./api";
import type { EstadoSuscripcion } from "../types";

export type PlanType = "monthly" | "annual" | "lifetime";

export interface FuncionalidadesPremium {
  features: string[];
}

export interface UpgradePrompt {
  message: string;
  features: string[];
}

export interface NoAdsStatus {
  is_premium: boolean;
}

export const monetizationService = {
  async getSubscriptionStatus(): Promise<EstadoSuscripcion> {
    const { data } = await api.get<EstadoSuscripcion>("/monetization/status/");
    return data;
  },

  async getPremiumFeatures(): Promise<FuncionalidadesPremium> {
    const { data } = await api.get<FuncionalidadesPremium>("/monetization/features/");
    return data;
  },

  async getUpgradePrompt(): Promise<UpgradePrompt> {
    const { data } = await api.get<UpgradePrompt>("/monetization/upgrade/");
    return data;
  },

  async getNoAdsStatus(): Promise<NoAdsStatus> {
    const { data } = await api.get<NoAdsStatus>("/monetization/no-ads/");
    return data;
  },

  async createCheckoutSession(planType: PlanType): Promise<string> {
    const { data } = await api.post<{ init_point: string }>("/premium/subscribe/", {
      planType,
    });
    return data.init_point;
  },

  async cancelSubscription(reason?: string): Promise<{ message: string; subscription_end_date?: string }> {
    const { data } = await api.post<{ message: string; subscription_end_date?: string }>(
      "/premium/cancel/",
      { reason },
    );
    return data;
  },

  async reactivateSubscription(): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("/premium/reactivate/", {});
    return data;
  },
};

