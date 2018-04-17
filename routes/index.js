const express = require("express");
const router = express.Router();
const Device = require("../models/device");

router.get("/", function(req, res) {
  Device.find({}, function(err, devices) {
    if (err) {
      return res.send(
        "there was an error while fetching records from the db..."
      );
    } else if (devices) {
      return res.render("home.html", { devices });
    }
  });
});

router.get("/home", function(req, res) {
  return res.redirect("/");
});

router.get("/settings", function(req, res) {
  Device.find({}, function(err, devices) {
    if (err) {
      return res.render("500.html");
    } else if (devices) {
      return res.render("settings.html", { devices });
    }
  });
});

router.get("/devices", function(req, res) {
  Device.find({}, function(err, devices) {
    if (err || !devices) {
      return res.render("500.html");
    } else {
      return res.json(devices);
    }
  });
});

router.post("/devices/add", function(req, res) {
  Device.findOne({ display_name: req.body.display_name }, function(
    err,
    withExistingDisplayName
  ) {
    if (err) {
      return res.render("500.html");
    } else if (withExistingDisplayName) {
      return res.render("400.html");
    } else {
      Device.create(
        {
          display_name: req.body.display_name,
          api_key: req.body.api_key,
          channel_id: req.body.channel_id,
          target: req.body.target,
          target_max: req.body.target_max,
          target_min: req.body.target_min
        },
        function(err, newDevice) {
          if (err || !newDevice) {
            return res.render("500.html");
          } else {
            return res.redirect("/settings");
          }
        }
      );
    }
  });
});

router.get("/devices/:device_id", function(req, res) {
  Device.findOne({ _id: req.params.device_id }, function(err, existingDevice) {
    if (err) {
      return res.render("500.html");
    } else if (!existingDevice) {
      return res.render("404.html");
    } else {
      return res.status(200).json(existingDevice);
    }
  });
});

router.put("/devices/:device_id", function(req, res) {
  Device.findOne({ _id: req.params.device_id }, function(err, existingDevice) {
    if (err) {
      return res.render("500.html");
    } else if (!existingDevice) {
      return res.render("404.html");
    } else {
      Object.keys(req.body).forEach(function(key) {
        existingDevice[key] = req.body[key];
      });

      existingDevice.save();
      return res.status(200).send({
        data: existingDevice,
        message: `device ${req.params.device_id} was succesfully updated...`,
        redirect: "/settings"
      });
    }
  });
});

router.delete("/devices/:device_id", function(req, res) {
  Device.findOne({ _id: req.params.device_id }, function(err, existingDevice) {
    if (err) {
      return res.render("500.html");
    } else if (!existingDevice) {
      return res.render("404.html");
    } else {
      existingDevice.remove();
      return res.status(200).send({
        data: null,
        message: `device ${req.params.device_id} was deleted...`,
        redirect: "/settings"
      });
    }
  });
});

module.exports = router;
