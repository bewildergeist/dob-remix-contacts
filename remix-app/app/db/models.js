import { mongoose } from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    first: {
      type: String,
      required: true,
      minLength: [2, "That's too short"],
    },
    last: {
      type: String,
      required: true,
      minLength: [2, "That's too short"],
    },
    avatar: {
      type: String,
      match: [
        /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
        "That's not a valid URL",
      ],
    },
    twitter: {
      type: String,
      match: [/^@?(\w){1,15}$/, "That's not a valid Twitter handle"],
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    notes: [
      {
        note: {
          type: String,
          required: true,
          minLength: [2, "That's too short"],
        },
      },
    ],
  },
  // Automatically add `createdAt` and `updatedAt` timestamps:
  // https://mongoosejs.com/docs/timestamps.html
  { timestamps: true },
);

// For each model you want to create, please define the model's name, the
// associated schema (defined above), and the name of the associated collection
// in the database (which will be created automatically).
export const models = [
  {
    name: "Contact",
    schema: contactSchema,
    collection: "contacts",
  },
];
