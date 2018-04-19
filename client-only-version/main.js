$(document).ready(function() {
  const dom = buildDom();
  //   console.log(dom);
  XMLHttpPromise("https://wi-iot-thermostats-demo.herokuapp.com/devices")
    .then(function(data) {
      if (data && Array.isArray(data)) {
        renderDeviceOptions(data, dom);
        document.getElementById("default-view").classList.remove("d-none");
        document.getElementById("no-devices-view").classList.add("d-none");
        return data;
      }
    })
    .then(function(data) {
      const timeinputs = Flatpickr(data, dom);
      (function() {
        $("#devices").on("change", function() {
          const device = getDeviceSettings(
            $(this)
              .find(":selected")
              .val(),
            data
          );
          if (device) render(device, timeinputs, dom);
        });
      })();

      $("#devices").trigger("change");
    })
    .catch(err => console.error(err));
});

function getDeviceSettings(device, data) {
  //   console.log(device, data);
  const match = data.filter(record => record["id"] === parseInt(device));
  //   console.log(match);
  if (match.length) return match[0];
  return null;
}

function render(device, timeinputs, dom) {
  const start = ymdhmsDateFormat(timeinputs.start.latestSelectedDateObj);
  const end = ymdhmsDateFormat(timeinputs.end.latestSelectedDateObj);

  getTimeRangeInputData(device, start, end, dom)
    .then(function(data) {
      const feeds = data.feeds.filter(x => x.field1 != null);
      renderTimeRangeSeries("chart", feeds);
      return feeds;
    })
    .then(function(data) {
      return data.map(x => x.field1);
    })
    .then(function(data) {
      renderAverage(
        dom,
        data,
        device.target,
        device.target_min,
        device.target_max
      );
      return data;
    })
    .then(function(data) {
      renderDeviationFromTargetMaximum(dom, data, device.target_max);
      return data;
    })
    .then(function(data) {
      renderDeviationFromTargetMinimum(dom, data, device.target_min);
      return data;
    })
    .then(function(data) {
      renderTargetMinimum(dom, data, device.target_min);
      return data;
    })
    .then(function(data) {
      renderTargetMaximum(dom, data, device.target_max);
      return data;
    })
    .catch(err => console.error(err));
}

function renderDeviceOptions(data, dom) {
  const template = `{{#devices}}<option value="{{ id }}">{{ display }}</option>{{/devices}}`;
  const html = Mustache.render(template, {
    devices: data,
    id: function() {
      return this._id.toString();
    },
    display: function() {
      return this.display_name;
    }
  });

  dom["devices"].innerHTML = html;
}

function renderAverage(dom, data, target, targetMin, targetMax) {
  if (data.length) {
    const sum = data.reduce(function(sum, current, idx) {
      return sum + parseFloat(current.trim());
    }, 0);

    const avg = sum / data.length;
    const avgVersusTarget = avg - target;
    if (avgVersusTarget < 0 && avg < targetMin) {
      dom.average.innerHTML = `
            <span class="text-center card-title mb-0">${avg.toFixed(
              2
            )}&deg;</span>
            <span class="text-center alert-danger">${avgVersusTarget.toFixed(
              2
            )}&deg; compared to target</span>`;
    } else if (avgVersusTarget < 0 && avg > targetMin) {
      dom.average.innerHTML = `
            <span class="text-center card-title mb-0">${avg.toFixed(
              2
            )}&deg;</span>
            <span class="text-center alert-success">${avgVersusTarget.toFixed(
              2
            )}&deg; compared to target</span>`;
    } else if (avgVersusTarget > 0 && avg > targetMax) {
      dom.average.innerHTML = `
            <span class="text-center card-title mb-0">${avg.toFixed(
              2
            )}&deg;</span>
            <span class="text-center alert-danger">+${avgVersusTarget.toFixed(
              2
            )}&deg; compared to target</span>`;
    } else if (avgVersusTarget > 0 && avg < targetMax) {
      dom.average.innerHTML = `
            <span class="text-center card-title mb-0">${avg.toFixed(
              2
            )}&deg;</span>
            <span class="text-center alert-success">+${avgVersusTarget.toFixed(
              2
            )}&deg; compared to target</span>`;
    }
  } else {
    dom.average.innerHTML = `
          <span class="text-center text-muted card-title mb-0">DNA</span>
          <span class="text-center text-muted">DNA</span>`;
  }

  return data;
}

function renderDeviationFromTargetMaximum(dom, data, targetMax) {
  if (data.length) {
    const filteredData = data.filter(x => x > targetMax);
    if (filteredData.length) {
      const deviation =
        filteredData
          .map(function(x) {
            return parseFloat(x.trim()) - targetMax;
          })
          .reduce(function(sum, current, idx) {
            return sum + current;
          }, 0) / filteredData.length;
      dom["deviation-from-target-maximum"].innerHTML = `
            <span class="alert-danger">+${deviation.toFixed(2)}&deg;</span>`;
    } else {
      dom["deviation-from-target-maximum"].innerHTML = `
            <span class="alert-success">None</span>`;
    }
  } else {
    dom[
      "deviation-from-target-maximum"
    ].innerHTML = `<span class="text-center text-muted">DNA</span>`;
  }
  return data;
}

function renderDeviationFromTargetMinimum(dom, data, targetMin) {
  if (data.length) {
    const filteredData = data.filter(x => x < targetMin);
    if (filteredData.length) {
      const deviation =
        filteredData
          .map(function(x) {
            return x - targetMin;
          })
          .reduce(function(sum, current, idx) {
            return sum + current;
          }, 0) / filteredData.length;

      dom["deviation-from-target-minimum"].innerHTML = `
              <span class="alert-danger">${deviation.toFixed(2)}&deg;</span>`;
    } else {
      dom["deviation-from-target-minimum"].innerHTML = `
              <span class="alert-success">None</span>`;
    }
  } else {
    dom[
      "deviation-from-target-minimum"
    ].innerHTML = `<span class="text-center text-muted">DNA</span>`;
  }
  return data;
}

function renderTargetMaximum(dom, data, targetMax) {
  if (data.length) {
    const max = Math.max.apply(null, data);
    dom.maximum.innerHTML = `<span class="text-center ${
      max > targetMax ? "alert-danger" : "alert-success"
    }">${max.toFixed(2)}&deg;</span>`;
  } else {
    dom.maximum.innerHTML = `<span class="text-center text-muted">DNA</span>`;
  }

  return data;
}

function renderTargetMinimum(dom, data, targetMin) {
  if (data.length) {
    const min = Math.min.apply(null, data);
    dom.minimum.innerHTML = `<span class="text-center ${
      min < targetMin ? "alert-danger" : "alert-success"
    }">${min.toFixed(2)}&deg;</span>`;
  } else {
    dom.minimum.innerHTML = `<span class="text-center text-muted">DNA</span>`;
  }

  return data;
}

function Flatpickr(data, dom) {
  const defaultTimes = getDefaultTimeInputs();

  let config = {
    enableTime: true,
    altInput: true,
    altFormat: "F j, Y H:i",
    dateFormat: "Y-m-d",
    onChange
  };

  const timeinputs = {
    start: flatpickr(
      "#time-inputs-start",
      setDefaultTimes(config, defaultTimes._24h_ago)
    ),
    end: flatpickr(
      "#time-inputs-end",
      setDefaultTimes(config, defaultTimes._now)
    )
  };

  function getDefaultTimeInputs() {
    let _now = new Date(Date.now());
    let _24h_ago = new Date(_now - 24 * 3600 * 1000);

    _now = _now.toISOString();
    _24h_ago = _24h_ago.toISOString();

    return {
      _now,
      _24h_ago
    };
  }

  function setDefaultTimes(config, value) {
    config.defaultDate = value;
    return config;
  }

  function onChange(selectedDates, dateStr, instance) {
    const device = getDeviceSettings(
      $("#devices")
        .find(":selected")
        .val(),
      data
    );
    if (device) render(device, timeinputs, dom);
    return false;
  }

  return timeinputs;
}

function renderTimeRangeSeries(containerId, data) {
  Highcharts.chart(containerId, {
    chart: {
      zoomType: "x"
    },
    title: {
      text: ""
    },
    subtitle: {
      text:
        document.ontouchstart === undefined
          ? "Click and drag in the plot area to zoom in"
          : "Pinch the chart to zoom in"
    },
    xAxis: {
      type: "datetime"
    },
    yAxis: {
      title: {
        text: "Temperature"
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, Highcharts.getOptions().colors[0]],
            [
              1,
              Highcharts.Color(Highcharts.getOptions().colors[0])
                .setOpacity(0)
                .get("rgba")
            ]
          ]
        },
        marker: {
          radius: 2
        },
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1
          }
        },
        threshold: null
      }
    },

    series: [
      {
        type: "area",
        name: "Temperature",
        data: data.map(function(record) {
          return [
            Date.parse(record.created_at),
            parseFloat(record.field1.trim())
          ];
        })
      }
    ]
  });
}

function getTimeRangeInputData(device, start, end) {
  //   const url = `https://api.thingspeak.com/channels/${
  //     device.channel_id
  //   }/feeds.json?start=${start}&end=${end}&timescale=10&api_key=${
  //     device.api_key
  //   }`;

  const url = `https://api.thingspeak.com/channels/470570/feeds.json?start=${start}&end=${end}&timescale=10&api_key=
  }`;

  return XMLHttpPromise(url);
}

function buildDom() {
  let dom = {};
  [
    "devices",
    "time-inputs-start",
    "time-inputs-end",
    "current",
    "average",
    "deviation-from-target-maximum",
    "deviation-from-target-minimum",
    "maximum",
    "minimum",
    "chart"
  ].forEach(function(id) {
    dom[id] = document.getElementById(id);
  });

  return dom;
}

function ymdhmsDateFormat(dateObject) {
  const strFormat = function(value) {
    return value > 9 ? value.toString() : "0" + value.toString();
  };
  const year = strFormat(dateObject.getFullYear());
  const month = strFormat(dateObject.getMonth() + 1);
  const date = strFormat(dateObject.getDate());
  const hours = strFormat(dateObject.getHours());
  const minutes = strFormat(dateObject.getMinutes());
  const seconds = strFormat(dateObject.getSeconds());

  return `${year}-${month}-${date}%20${hours}:${minutes}:${seconds}`;
}

function XMLHttpPromise(url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      }
    };

    xhr.onerror = function() {
      reject(xhr.statusText);
    };

    xhr.send();
  });
}
