import {
  type HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date },
    otpRequestedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;
export type UserResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
};

const UserModel = (models.User as Model<User>) || model<User>("User", userSchema);

export default UserModel;
