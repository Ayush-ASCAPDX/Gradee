import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

export type Otp = InferSchemaType<typeof otpSchema>;

const OtpModel = (models.Otp as Model<Otp>) || model<Otp>("Otp", otpSchema);

export default OtpModel;
