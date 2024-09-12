"use strict";
module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const UserSchema = new Schema(
    {
      name: { type: String },
      age: {
        type: Number,
      },
      team: {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    },
    { collection: "puser" }
  );
  return mongoose.model("Puser", UserSchema);
};
