$(document).ready(function() {
  $("body").bootstrapMaterialDesign();

  $(".btn-update-device").click(function() {
    const deviceId = $(this)
      .attr("data-device-id")
      .trim();

    const deviceName = $(this)
      .attr("data-device-name")
      .trim();

    const url = `/devices/${deviceId}`;
    const type = "PUT";
    const data = getRequestData(deviceId);

    $.ajax({
      url,
      type,
      dataType: "json",
      contentType: "application/json",
      data,
      success: function(res) {
        alert(`Settings for ${deviceName} were successfully updated...`);
        if (res.redirect) {
          window.location.href = res.redirect;
        }
      }
    });
  });

  $(".btn-delete-device").click(function() {
    const deviceId = $(this)
      .attr("data-device-id")
      .trim();

    const deviceName = $(this)
      .attr("data-device-name")
      .trim();

    if (
      confirm(
        `Are you sure you want to delete ${deviceName} ? This action is not reversible.`
      )
    ) {
      const url = `/devices/${deviceId}`;
      const type = "DELETE";

      $.ajax({
        url,
        dataType: "json",
        contentType: "application/json",
        type,
        success: function(res) {
          alert(`${deviceName} was successfully deleted...`);
          if (res.redirect) {
            window.location.href = res.redirect;
          }
        }
      });
    }
  });
});

function getRequestData(device) {
  return JSON.stringify({
    display_name: $(`#${device} input:text[data-config="display_name"]`)
      .val()
      .trim(),
    api_key: $(`#${device} input:text[data-config="api_key"]`)
      .val()
      .trim(),
    channel_id: $(`#${device} input:text[data-config="channel_id"]`)
      .val()
      .trim(),
    target: $(`#${device} input:text[data-config="target"]`)
      .val()
      .trim(),
    target_max: $(`#${device} input:text[data-config="target_max"]`)
      .val()
      .trim(),
    target_min: $(`#${device} input:text[data-config="target_min"]`)
      .val()
      .trim()
  });
}
