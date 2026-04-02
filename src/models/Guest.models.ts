import mongoose, { Schema, type Document } from "mongoose"

export interface Guest extends Document {
  guestId: string
  createdAt: Date
  lastActive: Date
  predictionsCount: number
  predictions: Array<{
    hobbies: string
    skills: string
    education: string
    workStyle: string
    interests: string
    result: {
      iq: number
      professions: string[]
      details: Array<{
        title: string
        match: number
        description: string
      }>
    }
    createdAt: Date
  }>
}

const GuestSchema: Schema<Guest> = new Schema({
  guestId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  predictionsCount: {
    type: Number,
    default: 0,
  },
  predictions: [
    {
      hobbies: String,
      skills: String,
      education: String,
      workStyle: String,
      interests: String,
      result: {
        iq: Number,
        professions: [String],
        details: [
          {
            title: String,
            match: Number,
            description: String,
          },
        ],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
})

const GuestModel = (mongoose.models.Guest as mongoose.Model<Guest>) || mongoose.model<Guest>("Guest", GuestSchema)
export default GuestModel

