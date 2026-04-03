import { z } from "zod";

// E.164 regex: + followed by 1–15 digits
const e164Regex = /^\+[1-9]\d{6,14}$/;

export const contactNumberSchema = z.object({
  number: z
    .string()
    .regex(e164Regex, "Enter a valid phone number with country code"),
  label: z.string().trim().min(1, "Add a label"),
  is_whatsapp: z.boolean(),
  is_primary: z.boolean(),
});

export type ContactNumberData = z.infer<typeof contactNumberSchema>;

export const profileSetupSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters"),
  contactNumbers: z
    .array(contactNumberSchema)
    .min(1, "Add at least one contact number")
    .max(5, "Maximum 5 contact numbers")
    .refine(
      (nums) => nums.filter((n) => n.is_primary).length === 1,
      { message: "One number must be set as primary" },
    ),
  city: z.string().trim().optional(),
  description: z.string().trim().optional(),
  pickupAddress: z.string().trim().optional(),
  instagramHandle: z.string().trim().optional(),
  tiktokHandle: z.string().trim().optional(),
  logoLocalUri: z.string().nullable().optional(),
  logoPublicUrl: z.string().nullable().optional(),
});

export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export const defaultContactNumber: ContactNumberData = {
  number: "",
  label: "WhatsApp",
  is_whatsapp: true,
  is_primary: true,
};

export const defaultProfileSetupValues: ProfileSetupFormData = {
  businessName: "",
  contactNumbers: [defaultContactNumber],
  city: "",
  description: "",
  pickupAddress: "",
  instagramHandle: "",
  tiktokHandle: "",
  logoLocalUri: null,
  logoPublicUrl: null,
};
