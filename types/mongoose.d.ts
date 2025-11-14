import { ObjectId } from "mongodb";

declare module "mongoose" {
  namespace Schema {
    interface Types {
      ObjectId: typeof ObjectId;
    }
  }
}
