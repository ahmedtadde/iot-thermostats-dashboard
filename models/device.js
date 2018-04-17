const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Device = new Schema(
  {
    display_name: {
      type: String,
      required: true
    },
    api_key: {
      type: String,
      required: true
    },
    channel_id: {
      type: Number,
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    target_max: {
      type: Number,
      required: true
    },
    target_min: {
      type: Number,
      required: true
    },
    created_on: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "thinkspeak_dashboard_db"
  }
);

module.exports = mongoose.model("Device", Device);
