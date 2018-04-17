$(document).ready(function() {
  $("body").bootstrapMaterialDesign();

  (function() {
    $("#devices").on("change", function() {
      const device = $(this)
        .find(":selected")
        .val();

      ThingSpeak(device);
      return false;
    });
  })();

  $("#devices").trigger("change");
});

function ThingSpeak(device) {
  const dom = buildDom();
  const flatpickrIdHooks = {
    start: "#time-range-start",
    end: "#time-range-end"
  };
  XMLHttpPromise(`/devices/${device}`)
    .then(data => {
      renderCurrentTemp(dom);
      return data;
    })
    .then(data => {
      const flatpickrInputs = activateFlatpickr(
        dom,
        flatpickrIdHooks,
        data.api_key,
        data.channel_id,
        data.target,
        data.target_min,
        data.target_max
      );
      return {
        ...data,
        flatpickr_inputs: flatpickrInputs
      };
    })
    .then(data => {
      render(
        dom,
        data.flatpickr_inputs,
        data.api_key,
        data.channel_id,
        data.target,
        data.target_min,
        data.target_max
      );
    })
    .catch(err => console.error(err));

  return false;
}

function activateFlatpickr(
  dom,
  elementIds,
  apiKey,
  channelId,
  target,
  targetMin,
  targetMax
) {
  const defaultTimes = getDefaultTimeInputs();

  let config = {
    enableTime: true,
    altInput: true,
    altFormat: "F j, Y H:i",
    dateFormat: "Y-m-d",
    onChange
  };

  const timeInputs = {
    start: flatpickr(
      elementIds.start,
      setDefaultTimes(config, defaultTimes._24h_ago)
    ),
    end: flatpickr(elementIds.end, setDefaultTimes(config, defaultTimes._now))
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
    render(dom, timeInputs, apiKey, channelId, target, targetMin, targetMax);
  }

  return timeInputs;
}

function renderCurrentTemp(dom) {
  const device = dom.devices.value;
  XMLHttpPromise(`/devices/${device}`)
    .then(data => {
      //   console.log("Updating to current temperature...");

      const url = `https://api.thingspeak.com/channels/${
        data.channel_id
      }/fields/1/last.json?api_key=${data.api_key}`;

      const target = data.target;
      const targetMax = data.target_max;
      const targetMin = data.target_min;

      XMLHttpPromise(url).then(function(data) {
        const current = parseFloat(data.field1.trim());
        const currentVersusTarget = current - target;
        if (currentVersusTarget < 0 && current < targetMin) {
          dom.current.innerHTML = `
                  <span class="text-center card-title mb-0">${current.toFixed(
                    2
                  )}&deg;</span>
                  <span class="text-center alert-danger">${currentVersusTarget.toFixed(
                    2
                  )}&deg; compared to target</span>`;
        } else if (currentVersusTarget < 0 && current > targetMin) {
          dom.current.innerHTML = `
                  <span class="text-center card-title mb-0">${current.toFixed(
                    2
                  )}&deg;</span>
                  <span class="text-center alert-success">${currentVersusTarget.toFixed(
                    2
                  )}&deg; compared to target</span>`;
        } else if (currentVersusTarget > 0 && current > targetMax) {
          dom.current.innerHTML = `
                  <span class="text-center card-title mb-0">${current.toFixed(
                    2
                  )}&deg;</span>
                  <span class="text-center alert-danger">+${currentVersusTarget.toFixed(
                    2
                  )}&deg; compared to target</span>`;
        } else if (currentVersusTarget > 0 && current < targetMax) {
          dom.current.innerHTML = `
                  <span class="text-center card-title mb-0">${current.toFixed(
                    2
                  )}&deg;</span>
                  <span class="text-center alert-success">+${currentVersusTarget.toFixed(
                    2
                  )}&deg; compared to target</span>`;
        } else if (currentVersusTarget === 0) {
          dom.current.innerHTML = `
                  <span class="text-center card-title mb-0">${current}&deg;</span>
                  <span class="text-center alert-success">same as target</span>`;
        }
      });

      setTimeout(renderCurrentTemp, 60000, dom);
    })
    .catch(function(err) {
      console.error(err);
    });
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

function renderTimeRangeSeries(containerId, data) {
  // console.log(
  //   data.map(function(record) {
  //     return [Date.parse(record.created_at), parseFloat(record.field1.trim())];
  //   })
  // );

  // const chart = new Rickshaw.Graph({
  //   element: document.getElementById(containerId),
  //   renderer: "line",
  //   series: [
  //     {
  //       data: data.map(function(record) {
  //         return {
  //           x: Date.parse(record.created_at),
  //           y: parseFloat(record.field1.trim())
  //         };
  //       })
  //     }
  //   ]
  // });

  // chart.render();

  // const xAxis = new Rickshaw.Graph.Axis.Time({
  //   graph: chart,
  //   ticksTreatment: "glow",
  //   timeFixture: new Rickshaw.Fixtures.Time.Local()
  // });

  // xAxis.render();

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

function getTimeRangeInputData(apiKey, channelId, start, end) {
  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?start=${start}&end=${end}&timescale=10&api_key=${apiKey}`;

  return XMLHttpPromise(url);
}

function render(
  dom,
  timeInputs,
  apiKey,
  channelId,
  target,
  targetMin,
  targetMax
) {
  const start = ymdhmsDateFormat(timeInputs.start.latestSelectedDateObj);
  const end = ymdhmsDateFormat(timeInputs.end.latestSelectedDateObj);

  // console.log(start, end);
  getTimeRangeInputData(apiKey, channelId, start, end)
    .then(function(data) {
      const feeds = data.feeds.filter(x => x.field1 != null);
      renderTimeRangeSeries("chart", feeds);
      return feeds;
    })
    .then(function(data) {
      return data.map(x => x.field1);
    })
    .then(function(data) {
      renderAverage(dom, data, target, targetMin, targetMax);
      return data;
    })
    .then(function(data) {
      renderDeviationFromTargetMaximum(dom, data, targetMax);
      return data;
    })
    .then(function(data) {
      renderDeviationFromTargetMinimum(dom, data, targetMin);
      return data;
    })
    .then(function(data) {
      renderTargetMinimum(dom, data, targetMin);
      return data;
    })
    .then(function(data) {
      renderTargetMaximum(dom, data, targetMax);
      return data;
    })
    .catch(err => console.error(err));
}

function buildDom() {
  let dom = {};
  [
    "devices",
    "time-range-start",
    "time-range-end",
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

    xhr.onload = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.statusText);
      }
    };

    xhr.onerror = function() {
      reject(xhr.statusText);
    };

    xhr.send();
  });
}
