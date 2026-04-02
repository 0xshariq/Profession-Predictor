import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpires: Date;
    isVerified: boolean;
}

const UserSchema: Schema<User> = new Schema({
    username: {
        type: String, required: true, trim: true, unique: true
    },
    email: { type: String, required: true, unique: true, match: [/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/, 'Please fill a valid email address'] },
    password: { type: String, required: true },
    verifyCode: { type: String, required: true },
    verifyCodeExpires: { type: Date, required: true },
    isVerified: { type: Boolean, default: false }
})

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>('User', UserSchema);
export default UserModel;