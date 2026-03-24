import { z } from "zod";

export const profileSetupSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters"),
  phone: z.string().trim().min(10, "WhatsApp number is required"),
  secondaryPhone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  description: z.string().trim().optional(),
  pickupAddress: z.string().trim().optional(),
  instagramHandle: z.string().trim().optional(),
  tiktokHandle: z.string().trim().optional(),
  logoLocalUri: z.string().nullable().optional(),
  logoPublicUrl: z.string().nullable().optional(),
});

export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export const defaultProfileSetupValues: ProfileSetupFormData = {
  businessName: "",
  phone: "",
  secondaryPhone: "",
  city: "",
  description: "",
  pickupAddress: "",
  instagramHandle: "",
  tiktokHandle: "",
  logoLocalUri: null,
  logoPublicUrl: null,
};
