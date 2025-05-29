# ZTE Web UI - REST API Documentation (Extended)

This document outlines the structure and common commands for the REST API serving the ZTE Web UI. The frontend primarily communicates with the backend via `goform` CGI scripts. This documentation is based on analysis of the frontend `service.js` and related configuration files.

## API Endpoint Structure

The Web UI uses two main endpoints for its operations:

1.  **GET Requests:** `/goform/goform_get_cmd_process`

    - Used for retrieving data and status information from the device.
    - Specific commands and parameters are passed as URL query parameters.
    - Example: `GET /goform/goform_get_cmd_process?cmd=Language&multi_data=1`

2.  **POST Requests:** `/goform/goform_set_cmd_process`
    - Used for sending commands to modify settings or perform actions on the device.
    - Commands and their values are typically sent as form data (application/x-www-form-urlencoded).
    - A `goformId` parameter usually specifies the action to be performed.
    - Example: `POST /goform/goform_set_cmd_process` with form data `goformId=SET_WEB_LANGUAGE&Language=en`

## Common Parameters

### For GET Requests:

- `cmd`: Specifies the information or parameter(s) to retrieve. Multiple commands can be comma-separated (e.g., `cmd=network_type,signalbar,sms_unread_num`).
- `multi_data=1`: Often used when requesting multiple pieces of data in a single `cmd` parameter. Indicates the response will contain key-value pairs for each requested command.
- `_`: A timestamp or random number, often appended to GET requests to prevent caching (e.g., `_=<timestamp>`).

### For POST Requests:

- `goformId`: Specifies the action or setting to be modified on the backend. This is the primary identifier for the POST operation.
- `AD`: An authentication data parameter or session token automatically included in POST requests by the frontend. Its exact generation involves `rd` (a random value) and `cipher.AD` from the frontend JavaScript. This is crucial for request validation on the backend.
- `isTest=false`: This parameter appears in the `service.js` and is likely for internal testing/simulation; it would not typically be part of the live API interaction from an external client.
- `notCallback=true`: (Internal to `service.js`) Seems to control frontend JavaScript callback handling, suggesting some operations might be polled for status rather than relying on a direct callback for completion.

## Data Encoding and Formats

- **JSON:** The primary data exchange format for API responses and structured POST data.
- **Hexadecimal Encoding:** SMS message content (`MessageBody` in SEND_SMS, `content` in GET_SMS) is typically hex-encoded.
- **Base64 Encoding:** USSD message data (`ussd_data`) is Base64 encoded.
- **Custom Delimited Strings:** Some configuration data, notably APN profiles (`APN_configX`), uses `($)` as a delimiter within a single string value. This requires frontend parsing.

## Polling and Asynchronous Operations

Many operations, especially those involving interaction with the modem or network (e.g., sending SMS, network scan, WPS, factory reset, firmware update), are asynchronous. The initial POST request might return a "success" indicating the process has started. The frontend then typically polls specific status parameters via GET requests to monitor progress and completion. Examples:

- SMS Send Status: Poll `sms_cmd_status_info`.
- Network Scan: Poll `m_netselect_status` then `m_netselect_contents`.
- Manual Network Registration: Poll `m_netselect_result`.
- WPS: Poll `WscStatus` or similar.
- Factory Reset: Poll `restore_flag`.
- Firmware Update: Poll `current_upgrade_state`, `ota_flow_state`.
- USSD: Poll `ussd_write_flag` then `ussd_data_info`.

The UI also uses a `timerUpdater` mechanism (in `service.js`) to periodically fetch a batch of common status parameters (e.g., `signalbar`, `network_type`, `ppp_status`, `sms_unread_num`, `battery_vol_percent`) via a single GET request.

## Error Handling and Result Codes

The Web UI is designed to handle error responses and status updates from the API.

### For POST Requests (`/goform/goform_set_cmd_process`):

POST request responses often include a `result` field in the JSON payload.

- **Success:**
  - `result: "success"` or `result: "0"` (e.g., for LOGIN) typically indicates the command was accepted or the operation was successful.
- **Failure:**
  - Other string values or numerical codes in the `result` field usually indicate an error or a specific failure reason. For example, for the `LOGIN` command, a `result` of `"3"` signifies an incorrect password, while other codes might denote "account locked" or other errors.
  - Some responses might include an `errorType` field or other specific fields providing more context about the error.
- **UI Reaction:** The frontend JavaScript (`service.js` and specific modules like `login.js`, `pin.js`) checks the `result` (and other relevant fields). Based on this, it:
  - Displays a generic success message (e.g., using `successOverlay()`).
  - Displays a generic error message (e.g., using `errorOverlay()`).
  - Displays a specific, translated error message using `showAlert()` by mapping the error code/string to a key in the i18n `.properties` files (e.g., `password_error`, `pin_error`, `ussd_fail`, `ERROR_PBM_REACH_MAX_RECORDS`).
  - Updates the UI state accordingly (e.g., re-enabling a form, clearing fields, prompting for PUK entry after too many PIN failures).

### For GET Requests (`/goform/goform_get_cmd_process`):

Error handling for GET requests is more varied:

- **Parameter Errors:** If the `cmd` parameter is invalid or malformed, the server might return an HTTP error (e.g., 400 Bad Request) or a JSON response indicating the error.
- **Data Not Available:** If requested data is not available (e.g., no SMS messages, SD card not present), the response JSON for the corresponding `cmd` key might be empty, null, or contain a specific status indicating this (e.g., `sd_card_state: "0"`).
- **Asynchronous Status Polling:** For operations that involve polling, the error or completion status is found within the values of the polled `cmd` parameters (e.g., `WscStatus` for WPS, `sms_cmd_status_info` for SMS sending, `current_upgrade_state` for firmware updates). The UI interprets these status codes to provide feedback to the user.
  - For example, `sms_cmd_status_info` returning "3" (fail) for an SMS send operation would cause the UI to mark that message as failed.
  - `current_upgrade_state` returning an error code (>100) for a firmware update would lead to an error message display.

The UI typically aims to translate technical error codes or states into user-friendly messages.

## API Command Examples

---

### 1. Wi-Fi Settings

#### 1.1. Get Basic Wi-Fi Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=m_ssid_enable,SSID1,AuthMode,HideSSID,WPAPSK1,MAX_Access_num,EncrypType,m_SSID,m_AuthMode,m_HideSSID,m_WPAPSK1,m_MAX_Access_num,m_EncrypType,wifi_guest_enable,SSID_guest,AuthMode_guest,HideSSID_guest,WPAPSK_guest,MAX_Access_num_guest,EncrypType_guest`
  - `multi_data=1`
- **Description:** Retrieves basic Wi-Fi settings for primary (SSID1), multi-SSID (m_SSID/SSID2), and potentially guest networks.
- **Example Response (JSON):**

  ```json
  {
    "m_ssid_enable": "1",
    "SSID1": "MyWiFi_SSID1",
    "AuthMode": "WPA2PSK",
    "HideSSID": "0",
    "WPAPSK1": "mysecretpassword",
    "MAX_Access_num": "32",
    "EncrypType": "AES",
    "m_SSID": "MyWiFi_SSID2",
    "m_AuthMode": "OPEN",
    "m_HideSSID": "0",
    "m_WPAPSK1": "",
    "m_MAX_Access_num": "5",
    "m_EncrypType": "NONE"
  }
  ```

  **Response Field Descriptions:**

  - `m_ssid_enable`: (String) Status of the Multi-SSID (often referred to as SSID2). "1" means enabled, "0" means disabled.
  - `SSID1`: (String) The SSID (network name) of the primary Wi-Fi network.
  - `AuthMode`: (String) The authentication mode for the primary Wi-Fi network. Examples: "OPEN" (no security), "SHARED" (WEP Shared Key), "WPA2PSK" (WPA2 Pre-Shared Key), "WPAPSKWPA2PSK" (WPA/WPA2 Mixed Mode Pre-Shared Key), "WPAWPA2PSKMix", "WPA3SAE", "WPA2PSKWPA3SAE".
  - `HideSSID`: (String) Indicates if the primary SSID is broadcast. "0" means the SSID is visible, "1" means it is hidden.
  - `WPAPSK1`: (String) The WPA Pre-Shared Key (the Wi-Fi password) for the primary Wi-Fi network. This field will be empty or not present if the `AuthMode` does not use a PSK.
  - `MAX_Access_num`: (String) The maximum number of client devices that can connect to the primary Wi-Fi network simultaneously.
  - `EncrypType`: (String) The encryption type used with the chosen `AuthMode` for the primary network. Examples: "NONE" (for OPEN AuthMode), "TKIP", "AES", "TKIPCCMP" (AES+TKIP mixed mode).
  - `m_SSID`: (String) The SSID (network name) of the secondary (Multi-SSID) Wi-Fi network.
  - `m_AuthMode`: (String) The authentication mode for the secondary Wi-Fi network.
  - `m_HideSSID`: (String) Indicates if the secondary SSID is broadcast. "0" means visible, "1" means hidden.
  - `m_WPAPSK1`: (String) The WPA Pre-Shared Key (password) for the secondary Wi-Fi network.
  - `m_MAX_Access_num`: (String) The maximum number of client devices for the secondary Wi-Fi network.
  - `m_EncrypType`: (String) The encryption type for the secondary Wi-Fi network.

#### 1.2. Set Basic Wi-Fi Settings (SSID1)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_SSID1_SETTINGS`
  - `ssid`: (String) SSID name for primary Wi-Fi
  - `broadcastSsidEnabled`: (String) "0" for broadcast enabled, "1" for disabled
  - `MAX_Access_num`: (String) Maximum number of connected stations
  - `security_mode`: (String) Security mode (e.g., "OPEN", "WPA2PSK")
  - `cipher`: (String) Encryption type (e.g., "NONE", "AES", "TKIPCCMP"). Dependent on `security_mode`.
  - `passphrase`: (String) Wi-Fi password (if security mode is not OPEN). Min 8 characters.
- **Description:** Modifies settings for the primary Wi-Fi SSID.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) Indicates the outcome of the operation. "success" means the settings were applied successfully. Other values might indicate specific errors such as "ERROR_INVALID_SSID", "ERROR_WIFI_PASSWORD_LENGTH".

#### 1.3. Set Basic Wi-Fi Settings (SSID2 / Multi-SSID)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (Parameters are prefixed with `m_` if distinct, or specific to SSID2)
  - `goformId=SET_WIFI_SSID2_SETTINGS`
  - `m_SSID`: (String) SSID name for the second SSID
  - `m_HideSSID`: (String) "0" for broadcast enabled, "1" for disabled
  - `m_MAX_Access_num`: (String) Maximum number of connected stations
  - `m_AuthMode`: (String) Security mode for SSID2
  - `m_EncrypType`: (String) Encryption type for SSID2
  - `m_WPAPSK1`: (String) Wi-Fi password for the second SSID
- **Description:** Modifies settings for the secondary/multi-SSID.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) Indicates the outcome. "success" for successful application.

#### 1.4. Set Multi-SSID Switch / Guest Wi-Fi Switch

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_INFO`
  - `m_ssid_enable`: (String) "0" to disable multi-SSID (SSID2), "1" to enable
  - `wifi_guest_enable`: (String) "0" to disable guest Wi-Fi, "1" to enable (if supported)
- **Description:** Enables or disables multi-SSID (SSID2) or Guest Wi-Fi functionality.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if the command was accepted.

#### 1.5. Get Advanced Wi-Fi Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=WirelessMode,CountryCode,Channel,HT_MCS,wifi_band,wifi_11n_cap,WIFI_SC_CHAN_BANDWIDTH,WIFI_PRIMARY_CH,WIFI_2G_CHANNEL_BONDING,WIFI_5G_CHANNEL_BONDING,wifi_channel_list_24G,wifi_channel_list_5G`
    - `WirelessMode`: Retrieves the current wireless operational mode (e.g., 802.11b, 802.11g, 802.11n, 802.11ac, 802.11ax, or mixed modes). This determines the Wi-Fi standard being used, affecting speed and compatibility.
    - `CountryCode`: Fetches the configured country or region code. This is important as it dictates regulatory domain settings, such as available Wi-Fi channels and maximum transmission power levels.
    - `Channel`: Gets the currently selected Wi-Fi channel for the active band. A value of "0" usually indicates automatic channel selection.
    - `HT_MCS`: Retrieves the High Throughput (HT) Modulation and Coding Scheme (MCS) index or a legacy data rate. For 802.11n and newer standards, the MCS index determines the theoretical maximum data rate based on factors like spatial streams, modulation type, and coding rate.
    - `wifi_band`: Identifies the currently active Wi-Fi frequency band (e.g., "b" or "0" for 2.4GHz, "a" or "1" for 5GHz, if the device is dual-band capable).
    - `wifi_11n_cap`: Specifically for 802.11n (and often relevant for newer standards operating in the 2.4GHz band), this retrieves the channel bandwidth capability. "0" typically means 20MHz bandwidth, "1" means 20/40MHz (allowing for wider channels and potentially higher throughput if conditions permit).
    - `WIFI_SC_CHAN_BANDWIDTH`: Retrieves the channel bandwidth setting for the 5GHz band (if supported). Values often map to "0" (20MHz), "1" (40MHz), "2" (80MHz), "3" (160MHz), "4" (80+80MHz for some advanced configurations). Wider bandwidths allow for higher data rates.
    - `WIFI_PRIMARY_CH`: When channel bonding (using wider channels like 40MHz, 80MHz, etc.) is active, this indicates the primary control channel number within the bonded set.
    - `WIFI_2G_CHANNEL_BONDING`: Retrieves the specific channel bonding configuration for the 2.4GHz band. "0" usually means 20MHz (no bonding). "1" might mean 40MHz with the secondary channel above the primary, and "2" might mean 40MHz with the secondary channel below the primary. This is only effective if `wifi_11n_cap` allows for 40MHz.
    - `WIFI_5G_CHANNEL_BONDING`: Similar to `WIFI_2G_CHANNEL_BONDING`, but for the 5GHz band, indicating how wider channels (40MHz, 80MHz, 160MHz) are formed.
    - `wifi_channel_list_24G`: Fetches a comma-separated string listing all the Wi-Fi channels that are legally permissible and available for use in the 2.4GHz band, based on the current `CountryCode` setting.
    - `wifi_channel_list_5G`: Fetches a comma-separated string listing all available channels in the 5GHz band, based on the `CountryCode` (if the device supports 5GHz).
  - `multi_data=1`: Ensures the response is a JSON object with keys corresponding to the requested `cmd` values.
- **Description:** Retrieves advanced Wi-Fi settings related to wireless standards, radio frequencies, channel management, and supported features.
- **Example Response (JSON):**

  ```json
  {
    "WirelessMode": "4",
    "CountryCode": "CN",
    "Channel": "0",
    "HT_MCS": "1",
    "wifi_band": "b",
    "wifi_11n_cap": "0",
    "WIFI_SC_CHAN_BANDWIDTH": "0",
    "WIFI_PRIMARY_CH": "1",
    "WIFI_2G_CHANNEL_BONDING": "0",
    "wifi_channel_list_24G": "1,2,3,4,5,6,7,8,9,10,11,12,13",
    "wifi_channel_list_5G": "36,40,44,48,149,153,157,161,165"
  }
  ```

  **Response Field Descriptions:**

  - `WirelessMode`: (String) The current wireless operational mode. Examples: "0" (802.11b only), "1" (802.11g only), "2" (802.11n only), "4" (802.11b/g/n mixed), "6" (802.11g/n mixed), "9" (802.11a/n/ac mixed for 5GHz), "11" (802.11b/g/n/ax mixed).
  - `CountryCode`: (String) The configured country or region code.
  - `Channel`: (String) The current Wi-Fi channel. "0" typically means "Auto".
  - `HT_MCS`: (String) High Throughput Modulation and Coding Scheme Index or legacy rate.
  - `wifi_band`: (String) Current active Wi-Fi band. "b" or "0" (2.4GHz), "a" or "1" (5GHz).
  - `wifi_11n_cap`: (String) Channel bandwidth for 2.4GHz: "0" (20MHz), "1" (20/40MHz).
  - `WIFI_SC_CHAN_BANDWIDTH`: (String) Channel bandwidth for 5GHz: "0" (20MHz), "1" (40MHz), "2" (80MHz), "3" (160MHz), "4" (80+80MHz).
  - `WIFI_PRIMARY_CH`: (String) Primary channel when channel bonding is used.
  - `WIFI_2G_CHANNEL_BONDING`: (String) 2.4GHz channel bonding: "0" (20MHz), "1" (40MHz above), "2" (40MHz below).
  - `wifi_channel_list_24G`: (String) Comma-separated list of available 2.4GHz channels.
  - `wifi_channel_list_5G`: (String) Comma-separated list of available 5GHz channels.

#### 1.6. Set Advanced Wi-Fi Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_INFO`: This `goformId` is often a general-purpose command for various Wi-Fi settings. The backend determines the specific action based on the other parameters provided.
  - `wifiMode`: (String) Sets the desired wireless operational mode. The value should correspond to one of the modes supported by the device (e.g., "4" for 802.11b/g/n mixed). Changing this can affect compatibility with older/newer client devices and maximum achievable speeds.
  - `countryCode`: (String) Sets the country or region code (e.g., "US", "GB", "JP"). This is critical as it defines the legal Wi-Fi channels and power limits for that region. Incorrect settings can lead to interference or regulatory non-compliance.
  - `wifi_band`: (String) If the device is dual-band capable, this sets the active band. Values like "a" or "1" typically select 5GHz, while "b" or "0" select 2.4GHz. Some devices might allow "auto" or manage this through `wifiMode`.
  - `selectedChannel`: (String) Sets the Wi-Fi channel. A specific channel number (e.g., "1", "6", "11" for 2.4GHz; "36", "40", "149" for 5GHz) can be chosen, or "0" (or "auto") can be used to enable automatic channel selection by the device, which attempts to find the least congested channel.
  - `abg_rate`: (String) Sets a specific data rate, usually for older Wi-Fi standards (802.11a/b/g) or as a fallback. For modern standards (n/ac/ax), MCS index selection is more common and might be implicitly handled or set via a different parameter (like `HT_MCS` if it were a settable parameter, though it's usually reported). Setting a fixed low rate can limit performance but might improve stability in noisy environments. "auto" is a common default.
  - `wifi_11n_cap`: (String) Configures the channel bandwidth for the 2.4GHz band, primarily for 802.11n/ax.
    - `"0"`: Forces 20MHz channel width. This is more resistant to interference but offers lower maximum throughput.
    - `"1"`: Allows 20/40MHz operation. The device can use a 40MHz channel if conditions are suitable (less interference, client support), potentially doubling throughput compared to 20MHz.
  - `WIFI_SC_CHAN_BANDWIDTH`: (String) Configures the channel bandwidth for the 5GHz band (if supported).
    - `"0"`: 20MHz
    - `"1"`: 40MHz
    - `"2"`: 80MHz
    - `"3"`: 160MHz (if supported by hardware)
    - `"4"`: 80+80MHz (a specific type of 160MHz operation, if supported)
      Wider bandwidths (80MHz, 160MHz) on 5GHz offer significantly higher throughput but may have slightly reduced range and more susceptibility to certain types of interference.
- **Description:** Modifies advanced Wi-Fi settings. Applying these settings may cause a brief Wi-Fi interruption as the radio reconfigures.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if the settings were accepted by the device. Errors might be returned if parameters are invalid or unsupported (e.g., "ERROR_INVALID_CHANNEL", "ERROR_UNSUPPORTED_MODE").

#### 1.7. Get WPS (Wi-Fi Protected Setup) Info

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=WscModeOption,AuthMode,RadioOff,EncrypType,wps_mode,WPS_SSID,m_ssid_enable,SSID1,m_SSID,m_EncrypType,WscStatus,wps_trigger_method`
  - `multi_data=1`
- **Description:** Retrieves WPS status, mode, and related Wi-Fi information.
- **Example Response (JSON):**

  ```json
  {
    "WscModeOption": "0",
    "AuthMode": "WPA2PSK",
    "RadioOff": "1",
    "EncrypType": "AES",
    "wps_mode": "PIN",
    "WPS_SSID": "MyWiFi_SSID1",
    "m_ssid_enable": "0",
    "SSID1": "MyWiFi_SSID1",
    "m_SSID": "MyWiFi_SSID2",
    "m_EncrypType": "NONE",
    "WscStatus": "0",
    "wps_trigger_method": "wps_hw_pb"
  }
  ```

  **Response Field Descriptions:**

  - `WscModeOption`: (String) WPS feature enable: "0" (off/inactive), "1" (on/active).
  - `AuthMode`: (String) Auth mode of the primary Wi-Fi.
  - `RadioOff`: (String) Wi-Fi radio status: "1" (on), "0" (off).
  - `EncrypType`: (String) Encryption type of primary Wi-Fi.
  - `wps_mode`: (String) Last used/configured WPS method: "PIN", "PBC".
  - `WPS_SSID`: (String) Target SSID for WPS.
  - `m_ssid_enable`: (String) Status of Multi-SSID.
  - `SSID1`: (String) Primary SSID name.
  - `m_SSID`: (String) Secondary SSID name.
  - `m_EncrypType`: (String) Encryption type of secondary SSID.
  - `WscStatus`: (String) Detailed WPS process status: "0" (Idle), "1" (In Progress), "2" (Success), "3" (Overlap), "4" (Fail/Error), "5" (Timeout).
  - `wps_trigger_method`: (String) How WPS was last initiated: "wps_hw_pb", "wps_sw_pb", "wps_sw_pin".

#### 1.8. Start WPS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=WIFI_WPS_SET`
  - `WPS_SSID`: (String)
  - `wps_mode`: (String) "PIN" or "PBC"
  - `wps_pin`: (String)
- **Description:** Initiates WPS. Poll `WscStatus`.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates WPS initiation accepted.

#### 1.9. Get Wi-Fi Sleep Mode / Range Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sysIdleTimeToSleep,wifi_coverage`
  - `multi_data=1`
- **Description:** Retrieves Wi-Fi sleep mode timeout and coverage.
- **Example Response (JSON):**

  ```json
  {
    "sysIdleTimeToSleep": "10",
    "wifi_coverage": "middle"
  }
  ```

  **Response Field Descriptions:**

  - `sysIdleTimeToSleep`: (String) Timeout in minutes for Wi-Fi sleep. "-1" or "0" for Never Sleep.
  - `wifi_coverage`: (String) Wi-Fi range: "short", "middle", "long".

#### 1.10. Set Wi-Fi Sleep Mode / Range Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Sleep Mode):**
  - `goformId=SET_WIFI_SLEEP_INFO`
  - `sysIdleTimeToSleep`: (String)
- **Form Data (Range/Coverage):**
  - `goformId=SET_WIFI_COVERAGE`
  - `wifi_coverage`: (String)
- **Description:** Sets Wi-Fi sleep mode or coverage.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if applied.

#### 1.11. AP Station Mode (Internet Wi-Fi / Wi-Fi Repeater/Extender)

- **Description:** Allows device to connect to an upstream Wi-Fi.
- **Get AP Station Basic Settings Example Response (JSON):**

  ```json
  {
    "ap_station_enable": "1",
    "ap_station_status": "connected",
    "ap_station_ssid": "UpstreamWiFi",
    "ap_station_mode": "WPA2PSK",
    "ap_station_channel": "6",
    "ap_station_auth_mode": "AES",
    "ap_station_encrypt_type": "AES",
    "internet_wifi_switch_select": "wifi"
  }
  ```

  **Response Field Descriptions:**

  - `ap_station_enable`: (String) "1" (enabled), "0" (disabled).
  - `ap_station_status`: (String) Connection status to upstream Wi-Fi: "disconnected", "connecting", "connected", "failed".
  - `ap_station_ssid`: (String) SSID of upstream Wi-Fi.
  - `ap_station_mode`: (String) Security mode of upstream Wi-Fi.
  - `ap_station_channel`: (String) Channel of upstream Wi-Fi.
  - `ap_station_auth_mode`: (String) Auth mode for upstream connection.
  - `ap_station_encrypt_type`: (String) Encryption for upstream connection.
  - `internet_wifi_switch_select`: (String) Preferred internet source: "wifi" or "wwan".

---

### 2. Network Settings

#### 2.1. Get Network Selection Info

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=current_network_mode,m_netselect_save,net_select_mode,m_netselect_contents,net_select,ppp_status,modem_main_state,lte_band_lock,wcdma_band_lock,gsm_band_lock,nr_band_lock,lte_band_list,wcdma_band_list,gsm_band_list,nr_band_list,m_netselect_status,m_netselect_result`
  - `multi_data=1`
- **Description:** Retrieves network settings.
- **Example Response (JSON):**

  ```json
  {
    "current_network_mode": "LTE",
    "m_netselect_save": "NETWORK_auto",
    "net_select_mode": "0",
    "m_netselect_contents": "2,ProviderA,46000,7;1,ProviderB,46001,2",
    "net_select": "NETWORK_auto",
    "ppp_status": "ppp_connected",
    "modem_main_state": "modem_init_complete",
    "lte_band_lock": "all",
    "wcdma_band_lock": "all",
    "nr_band_lock": "all",
    "lte_band_list": "B1,B3,B7,B20,B28,B38,B40,B41",
    "m_netselect_status": "0",
    "m_netselect_result": "0"
  }
  ```

  **Response Field Descriptions:**

  - `current_network_mode`: (String) Current registered RAT.
  - `m_netselect_save`: (String) Saved network selection preference.
  - `net_select_mode`: (String) Network selection mode: "0" (auto), "1" (manual).
  - `m_netselect_contents`: (String) Semicolon-separated list of scanned networks: `state,ShortName,Numeric(MCCMNC),Rat`.
    - `state`: "0" (Unknown), "1" (Available), "2" (Current), "3" (Forbidden).
    - `Rat`: "0" (2G), "2" (3G), "7" (4G/LTE), "11" (5G NR).
  - `net_select`: (String) Current active network selection preference.
  - `ppp_status`: (String) Data connection status.
  - `modem_main_state`: (String) Modem's operational state.
  - `lte_band_lock`: (String) Locked LTE bands.
  - `wcdma_band_lock`: (String) Locked WCDMA bands.
  - `nr_band_lock`: (String) Locked 5G NR bands.
  - `lte_band_list`: (String) Supported LTE bands.
  - `m_netselect_status`: (String) Network scan status: "0" (idle), "1" (scanning), "2" (success), "3" (fail).
  - `m_netselect_result`: (String) Manual registration result: "0" (idle/success), "1" (fail).

#### 2.2. Set Network Bearer Preference (Network Mode)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_BEARER_PREFERENCE`
  - `BearerPreference`: (String)
  - `lte_band_lock`: (String)
  - `wcdma_band_lock`: (String)
  - `gsm_band_lock`: (String)
  - `nr_band_lock`: (String)
- **Description:** Sets preferred RAT and band locks.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if accepted.

#### 2.3. Scan for Networks

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SCAN_NETWORK`
- **Description:** Initiates network scan. Poll `m_netselect_status`.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates scan initiated.

#### 2.4. Set Network (Manual Registration)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_NETWORK`
  - `NetworkNumber`: (String) MCCMNC
  - `Rat`: (String) Radio Access Technology code
- **Description:** Attempts manual registration. Poll `m_netselect_result`.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates registration attempt initiated.

#### 2.5. Get APN Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (Long list of APN-related `cmd` values)
  - `multi_data=1`
- **Description:** Retrieves APN profiles. `APN_configX` format: `ProfileName($)APNName($)Mode($)Dial($)Auth($)User($)Pass($)PDP($)DNS($)PriDNS($)SecDNS($)`.
- **Example Response (JSON Snippet):**

  ```json
  {
    "APN_config0": "Profile1($)internet($)manual($)*99#($)pap($)user($)pass($)IP($)auto($)($)auto($)($)",
    "m_profile_name": "Profile1",
    "apn_mode": "manual",
    "wan_apn": "internet",
    "ppp_auth_mode": "pap",
    "ppp_username": "user",
    "ppp_passwd": "password",
    "dns_mode": "auto",
    "prefer_dns_manual": "8.8.8.8",
    "standby_dns_manual": "8.8.4.4",
    "pdp_type": "IP"
  }
  ```

  **Response Field Descriptions (Selected):**

  - `APN_configX`: (String) Custom delimited string for APN profile X. Fields within by `($)`: ProfileName, APNName, APNSelectMode, DialNumber, AuthMode, Username, Password, PDPType, DNSMode, PrimaryDNS, SecondaryDNS.
  - `m_profile_name`: (String) Name of active APN profile.
  - `apn_mode`: (String) "auto" or "manual".
  - `wan_apn`: (String) APN of active connection.
  - `ppp_auth_mode`: (String) "none", "pap", "chap".
  - `ppp_username`: (String) PPP username.
  - `ppp_passwd`: (String) PPP password (often masked).
  - `dns_mode`: (String) "auto" or "manual".
  - `prefer_dns_manual`: (String) Primary DNS if manual.
  - `standby_dns_manual`: (String) Secondary DNS if manual.
  - `pdp_type`: (String) "IP", "IPV6", "IPV4V6".

#### 2.6. Add/Edit APN Profile

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (Includes `goformId=APN_PROC_EX`, `apn_action`, `profile_name`, etc.)
- **Description:** Adds/edits an APN profile.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if operation accepted.

#### 2.7. Delete APN Profile

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=APN_PROC_EX`, `apn_action="delete"`, `index`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if deletion accepted.

#### 2.8. Set Default APN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=APN_PROC_EX`, `apn_action="set_default"`, `index`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if setting default accepted.

#### 2.9. Set Connection Mode (Auto/Manual Dial) & Roaming

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_CONNECTION_MODE`, `ConnectionMode`, `roam_setting_option`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

#### 2.10. Connect/Disconnect WAN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=CONNECT_NETWORK` or `goformId=DISCONNECT_NETWORK`
- **Description:** Manually initiates/terminates WAN data connection.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if command accepted.

---

### 3. SMS (Short Message Service)

#### 3.1. Get SMS Messages

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (cmd, page, data_per_page, mem_store, tags, order_by)
- **Description:** Retrieves SMS list.
- **Example Response (JSON):**

  ```json
  {
    "messages": [
      {
        "id": "60",
        "number": "+1234567890",
        "tag": "0",
        "content": "48656C6C6F20576F726C64",
        "date": "13,08,07,10,30,15",
        "draft_group_id": "",
        "encode_type": "GSM7_default"
      }
    ],
    "sms_nv_total": "50",
    "sms_nv_unread": "2",
    "sms_sim_total": "10",
    "sms_sim_unread": "1"
  }
  ```

  **Response Field Descriptions:**

  - `messages`: (Array) SMS message objects.
    - `id`: (String) Message ID.
    - `number`: (String) Sender/Recipient number.
    - `tag`: (String) "0"(read), "1"(unread), "2"(sent), "3"(unsent), "4"(draft).
    - `content`: (String) Hex-encoded message.
    - `date`: (String) Timestamp "YY,MM,DD,HH,MM,SS".
    - `draft_group_id`: (String) For multi-recipient drafts.
    - `encode_type`: (String) "GSM7_default" or "UNICODE".
  - `sms_nv_total`: (String) Total SMS on device.
  - `sms_nv_unread`: (String) Unread SMS on device.
  - `sms_sim_total`: (String) Total SMS on SIM.
  - `sms_sim_unread`: (String) Unread SMS on SIM.

#### 3.2. Send SMS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SEND_SMS`, `Number`, `sms_time`, `MessageBody`, `ID`, `encode_type`)
- **Description:** Sends SMS. Poll `sms_cmd_status_info`. Error `result` could be "SMS_SEND_FAIL".
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" (command accepted) or error string. Polling `sms_cmd_status_info` provides actual send status (0=idle, 1=sending, 2=success, 3=fail).

#### 3.3. Save SMS Draft

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SAVE_SMS`, `SMSMessage`, `SMSNumber`, `Index`, etc.)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if draft saved.

#### 3.4. Delete SMS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=DELETE_SMS`, `msg_id`, `mem_store`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if accepted.

#### 3.5. Set SMS as Read

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_MSG_READ`, `msg_id`, `tag="0"`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if messages marked read.

#### 3.6. Get SMS Settings (Center Number, Capacity, etc.)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** `cmd=sms_parameter_info,sms_sim_capacity,sms_nv_capacity,sms_nv_total,sms_sim_total`, `multi_data=1`
- **Description:** Retrieves SMSC, validity, report settings, and storage capacity.
- **Example Response (JSON):**

  ```json
  {
    "sms_para_sca": "+12345678900",
    "sms_para_mem_store": "native",
    "sms_para_status_report": "0",
    "sms_para_validity_period": "255",
    "sms_sim_capacity": "50",
    "sms_nv_capacity": "100",
    "sms_nv_total": "23",
    "sms_sim_total": "5"
  }
  ```

  **Response Field Descriptions:**

  - `sms_para_sca`: (String) SMS Service Center Address (SMSC).
  - `sms_para_mem_store`: (String) Preferred storage: "native" (device), "sim".
  - `sms_para_status_report`: (String) Delivery report: "0" (off), "1" (on).
  - `sms_para_validity_period`: (String) Validity period code (e.g., "143" for 12h, "255" for max).
  - `sms_sim_capacity`: (String) Max SMS on SIM.
  - `sms_nv_capacity`: (String) Max SMS on device.
  - `sms_nv_total`: (String) Current SMS count on device.
  - `sms_sim_total`: (String) Current SMS count on SIM.

#### 3.7. Set SMS Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_MESSAGE_CENTER`, `save_time`, `MessageCenter`, `status_save`, `save_location`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

---

### 4. Device Status & Information

#### 4.1. Get General Status Information (Frequently Polled)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters (Example batch):** (long list of cmd values)
  - `multi_data=1`
- **Description:** Retrieves real-time status.
- **Example Response (JSON Snippet):**

  ```json
  {
    "modem_main_state": "modem_init_complete",
    "pin_status": "0",
    "loginfo": "ok",
    "signalbar": "4",
    "network_type": "LTE",
    "ppp_status": "ppp_connected",
    "sms_unread_num": "3",
    "RadioOff": "1",
    "simcard_roam": "mInternal",
    "battery_charging": "0",
    "battery_vol_percent": "85",
    "wan_ipaddr": "100.64.10.20"
  }
  ```

  **Response Field Descriptions (Selected):**

  - `modem_main_state`: (String) Modem operational state.
  - `pin_status`: (String) SIM PIN status: "0"(OK/Disabled), "1"(Required), "2"(PUK Required), "3"(Error), "4"(Disabled by user).
  - `loginfo`: (String) UI login status: "ok", "no".
  - `signalbar`: (String) Signal strength (0-5).
  - `network_type`: (String) Current RAT.
  - `ppp_status`: (String) Data connection status.
  - `sms_unread_num`: (String) Unread SMS count.
  - `RadioOff`: (String) Wi-Fi radio: "1"(on), "0"(off).
  - `simcard_roam`: (String) Roaming: "mInternal"(no), "mRoaming"(yes).
  - `battery_charging`: (String) "0"(no), "1"(yes), "2"(full).
  - `battery_vol_percent`: (String) Battery percentage.
  - `wan_ipaddr`: (String) WAN IP address.

#### 4.2. Get Detailed Device Information

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (long list of cmd values)
  - `multi_data=1`
- **Description:** Retrieves detailed device info.
- **Example Response (JSON Snippet):**

  ```json
  {
    "imei": "123456789012345",
    "web_version": "WEB_BLERUSMF90V1.0.0B03",
    "wa_inner_version": "FW_VERSION_XYZ",
    "hardware_version": "HW_V1.0",
    "mac_address": "00:11:22:AA:BB:CC",
    "msisdn": "+19876543210",
    "sim_iccid": "8901234567890123456F",
    "sim_imsi": "460001234567890",
    "rssi": "-75",
    "lte_rsrp": "-90",
    "model_name": "MF823"
  }
  ```

  **Response Field Descriptions (Selected):**

  - `imei`: (String) Device IMEI.
  - `web_version`: (String) Web UI software version.
  - `wa_inner_version`: (String) Firmware version.
  - `hardware_version`: (String) Hardware version.
  - `mac_address`: (String) LAN MAC address.
  - `msisdn`: (String) SIM phone number.
  - `sim_iccid`: (String) SIM ICCID.
  - `sim_imsi`: (String) SIM IMSI.
  - `rssi`: (String) Received Signal Strength Indicator (dBm).
  - `lte_rsrp`: (String) LTE Reference Signal Received Power (dBm).
  - `model_name`: (String) Device model.

#### 4.3. Get Currently Attached Wi-Fi Devices

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** `cmd=station_list`
- **Description:** Retrieves connected Wi-Fi clients.
- **Example Response (JSON):**

  ```json
  {
    "station_list": [
      {
        "mac_addr": "00:23:CD:AC:08:7E",
        "hostname": "MyLaptop",
        "ip_addr": "192.168.0.101",
        "conn_time": "3600"
      },
      {
        "mac_addr": "34:E0:CF:E0:B2:99",
        "hostname": "android-device",
        "ip_addr": "192.168.0.102",
        "conn_time": "7200"
      }
    ]
  }
  ```

  **Response Field Descriptions:**

  - `station_list`: (Array) List of connected Wi-Fi client objects.
    - `mac_addr`: (String) Client MAC address.
    - `hostname`: (String) Client hostname.
    - `ip_addr`: (String) Client IP address.
    - `conn_time`: (String) Connection duration in seconds.

#### 4.4. Get Traffic Statistics

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (cmd values for traffic stats)
  - `multi_data=1`
- **Description:** Retrieves data usage.
- **Example Response (JSON):**

  ```json
  {
    "realtime_tx_bytes": "102400",
    "realtime_rx_bytes": "204800",
    "realtime_time": "3600",
    "realtime_tx_thrpt": "80000",
    "realtime_rx_thrpt": "160000",
    "monthly_tx_bytes": "102400000",
    "monthly_rx_bytes": "204800000",
    "monthly_time": "360000",
    "date_month": "05"
  }
  ```

  **Response Field Descriptions:**

  - `realtime_tx_bytes`: (String) Bytes sent in current session.
  - `realtime_rx_bytes`: (String) Bytes received in current session.
  - `realtime_time`: (String) Duration of current session (seconds).
  - `realtime_tx_thrpt`: (String) Current TX speed (bps).
  - `realtime_rx_thrpt`: (String) Current RX speed (bps).
  - `monthly_tx_bytes`: (String) Bytes sent this month.
  - `monthly_rx_bytes`: (String) Bytes received this month.
  - `monthly_time`: (String) Connection duration this month (seconds).
  - `date_month`: (String) Current month for stats (e.g., "05").

#### 4.5. Set Traffic Alert / Data Limit

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_TRAFFIC_ALERT`, `data_volume_limit_switch`, etc.)
- **Description:** Configures data usage limits.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

#### 4.6. Clear Traffic Data

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=CLEAR_TRAFFIC_DATA`
- **Description:** Resets traffic statistics.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if data cleared.

---

### 5. System Administration

#### 5.1. Login

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=LOGIN`
  - `password`: (String) Administrator password.
- **Description:** Authenticates the user to access the web UI.
- **Related Configuration:**
  - `js/config/config.js`: `HAS_LOGIN` (if false, login might be bypassed), `PASSWORD_ENCODE` (if true, frontend Base64 encodes password), `LOGIN_SECURITY_SUPPORT` (enables lockout), `MAX_LOGIN_COUNT` (lockout threshold).
  - `custom_parameter` / `default_parameter`: `admin_Password` (default admin password).
- **Example Response (JSON):**

  - Success:

    ```json
    {
      "result": "0"
    }
    ```

    **Response Field Descriptions (Success):**

    - `result`: (String) "0" indicates successful authentication. A session is typically established, and the frontend can then generate the `AD` token for subsequent authenticated requests.

  - Failure (Incorrect Password):

    ```json
    {
      "result": "3"
    }
    ```

    **Response Field Descriptions (Incorrect Password):**

    - `result`: (String) A specific error code, commonly "3", indicating the provided password was incorrect. The UI typically displays an "Incorrect password" message and may decrement a login attempt counter if `LOGIN_SECURITY_SUPPORT` is enabled.

  - Failure (Account Locked):

    ```json
    {
      "result": "4"
    }
    ```

    **Response Field Descriptions (Account Locked):**

    - `result`: (String) A specific code (e.g., "4", or a string like "ERROR_LOGIN_ACCOUNT_LOCKED" or "MAX_LOGIN_TIMES") indicating the account is temporarily locked due to exceeding `MAX_LOGIN_COUNT` failed attempts. The UI will prevent further login attempts for a cooldown period.

  - Other errors may be indicated by different numeric or string `result` values.

- **Workflow:**
  1. User submits password via the UI.
  2. Frontend JavaScript (in `js/login.js`) may Base64 encode the password if `PASSWORD_ENCODE` in `config.js` is true.
  3. The `LOGIN` request is sent.
  4. The backend validates the credentials against the stored admin password.
  5. If validation is successful, the backend establishes a session (details of session mechanism are backend-specific). The frontend UI then typically considers the user logged in and enables access to protected sections. The crucial `AD` token, required for subsequent POST requests, is usually generated by frontend JavaScript logic based on data available after successful login (often involving a random component `rd` and a cipher key `cipher.AD`).

#### 5.2. Logout

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=LOGOUT`
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if logout was processed.

#### 5.3. Change Admin Password

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=CHANGE_PASSWORD`
  - `oldPassword`: (String)
  - `newPassword`: (String)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if password changed. An error string if `oldPassword` is incorrect.

#### 5.4. Get PIN Status/Attempts

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=pinnumber,pin_status,puknumber,pin_lock_flag`, `multi_data=1`)
- **Description:** Retrieves PIN/PUK status.
- **Example Response (JSON):**

  ```json
  {
    "pinnumber": "3",
    "pin_status": "0",
    "puknumber": "10",
    "pin_lock_flag": "0"
  }
  ```

  **Response Field Descriptions:**

  - `pinnumber`: (String) Remaining PIN attempts.
  - `pin_status`: (String) "0"(OK/Disabled), "1"(Required), "2"(PUK Required), "3"(Error), "4"(Disabled by user).
  - `puknumber`: (String) Remaining PUK attempts.
  - `pin_lock_flag`: (String) "0"(Not locked), "1"(PIN locked), "2"(PUK locked).

#### 5.5. Enter PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=ENTER_PIN`, `PinNumber`)
- **Example Response (JSON):**

  - Success:
    ```json
    { "result": "success" }
    ```
  - Error:

    ```json
    { "result": "PIN_ERROR" }
    ```

    ```json
    { "result": "ERROR_SIM_PUK_REQUIRED" }
    ```

    **Response Field Descriptions:**

  - `result`: (String) "success" if PIN accepted. Specific error strings like "PIN_ERROR" or "ERROR_SIM_PUK_REQUIRED" on failure.

#### 5.6. Enter PUK and Set New PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=ENTER_PUK`, `PUKNumber`, `PinNumber`)
- **Example Response (JSON):**
  - Success:
    ```json
    { "result": "success" }
    ```
  - Error:
    ```json
    { "result": "PUK_ERROR" }
    ```
    **Response Field Descriptions:**
  - `result`: (String) "success" if PUK accepted and new PIN set. "PUK_ERROR" or similar on failure.

#### 5.7. Enable/Disable/Change PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (Varies: `goformId=ENABLE_PIN/DISABLE_PIN/CHANGE_PIN`, `OldPinNumber`, `NewPinNumber`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if PIN operation successful.

#### 5.8. Get LAN Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=lan_ipaddr,lan_netmask,...`, `multi_data=1`)
- **Example Response (JSON):**

  ```json
  {
    "lan_ipaddr": "192.168.0.1",
    "lan_netmask": "255.255.255.0",
    "mac_address": "AA:BB:CC:11:22:33",
    "dhcpEnabled": "1",
    "dhcpStart": "192.168.0.100",
    "dhcpEnd": "192.168.0.200",
    "dhcpLease_hour": "24",
    "LocalDomain": "zte.com"
  }
  ```

  **Response Field Descriptions:**

  - `lan_ipaddr`: (String) LAN IP address of the device.
  - `lan_netmask`: (String) LAN subnet mask.
  - `mac_address`: (String) LAN MAC address.
  - `dhcpEnabled`: (String) "1"(enabled), "0"(disabled).
  - `dhcpStart`: (String) DHCP pool start IP.
  - `dhcpEnd`: (String) DHCP pool end IP.
  - `dhcpLease_hour`: (String) DHCP lease time in hours.
  - `LocalDomain`: (String) Local domain name.

#### 5.9. Set LAN (DHCP) Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=DHCP_SETTING`, `lanIp`, `lanNetmask`, etc.)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

#### 5.10. Restore Factory Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=RESTORE_FACTORY_SETTINGS`
- **Description:** Resets device. Poll `restore_flag`.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates process started.

#### 5.11. Restart Device

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=REBOOT_DEVICE`
- **Description:** Restarts device.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates process started.

#### 5.12. Set Web UI Language

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_WEB_LANGUAGE`, `Language`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if language applied.

#### 5.13. Get Fast Boot Setting Response (JSON):\*\*

    ```json
    {
        "fast_boot_enable": "0"
    }
    ```

    **Response Field Descriptions:**
    * `fast_boot_enable`: (String) "0"(disabled), "1"(enabled).

#### 5.14. Set Fast Boot Setting Response (JSON):\*\*

    ```json
    {
        "result": "success"
    }
    ```

    **Response Field Descriptions:**
    * `result`: (String) "success" if setting changed.

---

### 6. USSD (Unstructured Supplementary Service Data)

#### 6.1. Send USSD Command / Reply to USSD

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (Varies for send/reply: `goformId=USSD_PROCESS`, `USSD_operator`, `USSD_send_number` or `USSD_reply_number`)
- **Description:** Sends/replies to USSD. Poll `ussd_write_flag`, then `ussd_data_info`. Error `result` may include "USSD_SEND_ERROR", "USSD_REPLY_ERROR".
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates command sent to modem. Actual USSD interaction status is polled.

#### 6.2. Cancel USSD Session

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=USSD_PROCESS`, `USSD_operator="ussd_cancel"`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if cancel accepted.

#### 6.3. Get USSD Data Info (After Sending/Replying)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=ussd_data_info,ussd_action,ussd_write_flag`, `multi_data=1`)
- **Description:** Retrieves USSD response.
- **Example Response (JSON):**

  ```json
  {
    "ussd_data": "WW91ciBiYWxhbmNlIGlzICQxMC4wMA==",
    "ussd_action": "0",
    "ussd_write_flag": "0"
  }
  ```

  **Response Field Descriptions:**

  - `ussd_data`: (String) Base64 encoded USSD message from network.
  - `ussd_action`: (String) "0"(Display, end session), "1"(Input required), "2"(Network end), "3"(Other), "4"(Timeout).
  - `ussd_write_flag`: (String) "0"(Idle/Response received), "1"(Waiting for network).

---

### 7. SD Card & DLNA

#### 7.1. Get SD Card & HTTP Share Configuration

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=sdcard_mode_option,sd_card_state,...`, `multi_data=1`)
- **Example Response (JSON):**

  ```json
  {
    "sdcard_mode_option": "1",
    "sd_card_state": "1",
    "HTTP_SHARE_STATUS": "Enabled",
    "HTTP_SHARE_CARD_USER": "user",
    "HTTP_SHARE_WR_AUTH": "readWrite",
    "HTTP_SHARE_FILE": "/mmc2",
    "sd_card_total_size": "15800000000",
    "sd_card_avi_space": "10000000000"
  }
  ```

  **Response Field Descriptions:**

  - `sdcard_mode_option`: (String) "0"(HTTP Share), "1"(USB Mode).
  - `sd_card_state`: (String) "0"(No SD), "1"(Ready), "2"(Error), "3"(Formatting).
  - `HTTP_SHARE_STATUS`: (String) "Enabled" or "Disabled".
  - `HTTP_SHARE_CARD_USER`: (String) Username for HTTP share.
  - `HTTP_SHARE_WR_AUTH`: (String) "readOnly" or "readWrite".
  - `HTTP_SHARE_FILE`: (String) Shared path.
  - `sd_card_total_size`: (String) Total SD capacity (bytes).
  - `sd_card_avi_space`: (String) Available SD space (bytes).

#### 7.2. Set SD Card Mode (USB / HTTP Share)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=HTTPSHARE_MODE_SET`, `mode_set`)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if mode changed.

#### 7.3. Set SD Card HTTP Sharing Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=HTTPSHARE_AUTH_SET`, `HTTP_SHARE_STATUS`, etc.)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

#### 7.4. File Operations (HTTP Share)

- **Get File List Response Example (JSON):**

  ```json
  [
    {
      "filename": "photo.jpg",
      "type": "file",
      "size": "102400",
      "date": "2023-05-20 10:00:00"
    },
    {
      "filename": "My Documents",
      "type": "folder",
      "size": "0",
      "date": "2023-05-19 15:30:00"
    }
  ]
  ```

  **Response Field Descriptions (per item):**

  - `filename`: (String) File/folder name.
  - `type`: (String) "file" or "folder".
  - `size`: (String) File size in bytes ("0" for folders).
  - `date`: (String) Last modification timestamp.

- **Upload File Response:** Often not direct JSON but an HTML response within an iframe. Success/failure needs to be parsed from this iframe content by frontend. Failures might be "SD_UPLOAD_SPACE_NOT_ENOUGH", "SD_UPLOAD_DATA_LOST".

#### 7.5. Get DLNA Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=dlna_language,dlna_name,...`, `multi_data=1`)
- **Example Response (JSON):**

  ```json
  {
    "dlna_language": "english",
    "dlna_name": "MyDLNAServer",
    "dlna_share_audio": "on",
    "dlna_share_video": "on",
    "dlna_share_image": "on",
    "dlna_scan_state": "0",
    "sd_card_state": "1",
    "sdcard_mode_option": "0"
  }
  ```

  **Response Field Descriptions:**

  - `dlna_language`: (String) DLNA server language.
  - `dlna_name`: (String) DLNA server friendly name.
  - `dlna_share_audio`: (String) "on" or "off".
  - `dlna_share_video`: (String) "on" or "off".
  - `dlna_share_image`: (String) "on" or "off".
  - `dlna_scan_state`: (String) "0"(idle), "1"(scanning).
  - `sd_card_state`: (String) SD card status.
  - `sdcard_mode_option`: (String) SD card mode.

#### 7.6. Set DLNA Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=DLNA_SETTINGS`, `dlna_language`, etc.)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

#### 7.7. Rescan DLNA Media

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=DLNA_RESCAN`
- **Description:** Initiates DLNA media rescan. Poll `dlna_scan_state`.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates rescan initiated.

---

### 8. Firewall Management

#### 8.1. Get Port Filter Settings Response Example (JSON):\*\*

    ```json
    {
        "filter_default_policy": "ACCEPT",
        "filter_enable": "1",
        "filter_rule_list": [
            {"src_ip":"192.168.0.10", "src_port":"any", "dst_ip":"any", "dst_port":"80", "protocol":"TCP", "action":"DROP", "comment":"BlockWebForPC1"}
        ]
    }
    ```

    **Response Field Descriptions:**
    * `filter_default_policy`: (String) "ACCEPT" or "DROP".
    * `filter_enable`: (String) "1"(enabled), "0"(disabled).
    * `filter_rule_list`: (Array) List of rule objects.
        * `src_ip`, `dst_ip`: (String) IP address or "any".
        * `src_port`, `dst_port`: (String) Port or "any".
        * `protocol`: (String) "TCP", "UDP", "BOTH", "ICMP".
        * `action`: (String) "ACCEPT" or "DROP".
        * `comment`: (String) Rule description.

#### 8.5. Get Port Mapping (Virtual Server) Settings Response Example (JSON):\*\*

    ```json
    {
        "port_map_enable": "1",
        "port_map_rule_list": [
            {"wan_port_range":"8080", "lan_ip_addr":"192.168.0.100", "lan_port_range":"80", "protocol":"TCP", "description":"WebServer"}
        ]
    }
    ```

    **Response Field Descriptions:**
    * `port_map_enable`: (String) "1"(enabled), "0"(disabled).
    * `port_map_rule_list`: (Array) List of rule objects.
        * `wan_port_range`: (String) External port/range.
        * `lan_ip_addr`: (String) Internal IP.
        * `lan_port_range`: (String) Internal port/range.
        * `protocol`: (String) "TCP", "UDP", "BOTH".
        * `description`: (String) Rule description.

#### 8.8. Get DMZ Settings Response Example (JSON):\*\*

    ```json
    {
        "dmz_enable": "0",
        "dmz_ip_addr": "192.168.0.150"
    }
    ```

    **Response Field Descriptions:**
    * `dmz_enable`: (String) "0"(disabled), "1"(enabled).
    * `dmz_ip_addr`: (String) LAN IP of DMZ host.

#### 8.10. Get UPnP Settings Response Example (JSON):\*\*

    ```json
    {
        "upnp_enable": "1"
    }
    ```

    **Response Field Descriptions:**
    * `upnp_enable`: (String) "1"(enabled), "0"(disabled).

#### 8.12. Get System Security Settings Response Example (JSON):\*\*

    ```json
    {
        "remote_management_enable": "0",
        "wan_ping_filter_enable": "1"
    }
    ```

    **Response Field Descriptions:**
    * `remote_management_enable`: (String) "0"(disabled), "1"(enabled).
    * `wan_ping_filter_enable`: (String) "1"(ping blocked), "0"(ping allowed).

---

### 9. Phonebook Management

#### 9.1. Get Phonebook Contacts

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=phonebook_data`
  - `page`: (String)
  - `data_per_page`: (String)
  - `mem_store`: (String) "0"(SIM), "1"(Device), "2"(All)
  - `group_id`: (String, Optional)
  - `order_by`: (String, Optional)
- **Description:** Retrieves contacts.
- **Example Response (JSON):**

  ```json
  {
    "contacts": [
      {
        "id": "1",
        "name": "John Doe",
        "mobile_phone": "+15551234",
        "home_phone": "+15555678",
        "office_phone": "",
        "email": "john@example.com",
        "group_id": "0",
        "mem_store": "1"
      }
    ],
    "sim_contact_total": "250",
    "sim_contact_used": "20",
    "nv_contact_total": "500",
    "nv_contact_used": "150"
  }
  ```

  **Response Field Descriptions:**

  - `contacts`: (Array) List of contact objects.
    - `id`: (String) Contact ID within its store.
    - `name`: (String) Contact name.
    - `mobile_phone`: (String) Primary mobile number.
    - `home_phone`: (String) Home phone (optional).
    - `office_phone`: (String) Office phone (optional).
    - `email`: (String) Email address (optional).
    - `group_id`: (String) Group ID.
    - `mem_store`: (String) "0"(SIM), "1"(Device).
  - `sim_contact_total`: (String) Max SIM contacts.
  - `sim_contact_used`: (String) Used SIM contacts.
  - `nv_contact_total`: (String) Max device contacts.
  - `nv_contact_used`: (String) Used device contacts.

#### 9.2. Add/Edit Phonebook Contact

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SAVE_PHONEBOOK`
  - `Index`: (String) "-1" for new, ID for edit.
  - `pbm_name`: (String)
  - `pbm_number`: (String)
  - `pbm_storage_type`: (String) "0" or "1"
- **Description:** Adds/updates a contact. Error `result` may be "ERROR_PBM_REACH_MAX_RECORDS".
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" or error string.

#### 9.3. Delete Phonebook Contact(s)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=DELETE_PHONEBOOK`, `pbm_index`, `pbm_storage_type`)
- **Description:** Deletes contacts.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if accepted.

#### 9.4. Get Phonebook Capacity

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=pb_sim_capacity,pb_nv_capacity`, `multi_data=1`)
- **Description:** Retrieves max phonebook capacities.
- **Example Response (JSON):**

  ```json
  {
    "pb_sim_capacity": "250",
    "pb_nv_capacity": "500"
  }
  ```

  **Response Field Descriptions:**

  - `pb_sim_capacity`: (String) Max SIM contacts.
  - `pb_nv_capacity`: (String) Max device contacts.

---

### 10. Firmware Update (OTA/FOTA)

#### 10.1. Get Update Status & Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (cmd values for update status)
  - `multi_data=1`
- **Example Response (JSON):**

  ```json
  {
    "new_version_state": "1",
    "current_upgrade_state": "0",
    "is_mandatory": "0",
    "dm_isautoupdate": "1",
    "dm_pollingcycle": "20160",
    "dm_update_roam_permission": "0",
    "ota_version": "CurrentFirmwareV1",
    "ota_new_version": "NewFirmwareV2"
  }
  ```

  **Response Field Descriptions:**

  - `new_version_state`: (String) "0"(No new), "1"(Available), "2"(Downloading), "3"(Downloaded).
  - `current_upgrade_state`: (String) "0"(Idle), "1"(Checking), "2"(Downloading), "3"(Verifying), "4"(Installing), "100"(Success), >100 (Error codes).
  - `is_mandatory`: (String) "0"(Optional), "1"(Mandatory).
  - `dm_isautoupdate`: (String) Auto-check: "0"(off), "1"(on).
  - `dm_pollingcycle`: (String) Auto-check interval (minutes).
  - `dm_update_roam_permission`: (String) Allow update on roaming: "0"(off), "1"(on).
  - `ota_version`: (String) Current firmware version.
  - `ota_new_version`: (String) Available new firmware version.

#### 10.2. Set OTA Update Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_OTA_UPDATE_SETTINGS`, `dm_isautoupdate`, etc.)
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if settings applied.

#### 10.3. Trigger Update Check / Start Update

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=CHECK_NEW_VERSION` or `goformId=START_UPGRADE`)
- **Description:** Poll `new_version_state` and `current_upgrade_state`.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" indicates process initiated.

---

### 11. STK (SIM Application Toolkit)

#### 11.1. Get STK Status/Menu

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** (`cmd=stk_flag_info,stk_menu_info`, `multi_data=1`)
- **Description:** Retrieves STK availability and current menu/prompt.
- **Example Response (JSON):**

  ```json
  {
    "stk_flag_info": "1",
    "stk_menu_info": {
      "type": "menu",
      "title": "Operator Services",
      "items": [
        { "id": "1", "text": "Balance" },
        { "id": "2", "text": "Services" }
      ],
      "default_item_id": "1"
    }
  }
  ```

  **Response Field Descriptions:**

  - `stk_flag_info`: (String) "0"(Not available/Idle), "1"(Menu/Prompt available).
  - `stk_menu_info`: (Object) Details of STK screen.
    - `type`: (String) "menu", "text_display", "input_prompt".
    - `title`: (String) Screen/menu title.
    - `items`: (Array) Menu items if `type` is "menu".
      - `id`: (String) Item ID.
      - `text`: (String) Item display text.
    - `default_item_id`: (String) Pre-selected item ID.

#### 11.2. Send STK Response/Selection

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (`goformId=SET_STK_RESPONSE`, `stk_select_id`, `stk_input_text`, `stk_confirm`)
- **Description:** Sends user interaction to STK application.
- **Example Response (JSON):**

  ```json
  {
    "result": "success"
  }
  ```

  **Response Field Descriptions:**

  - `result`: (String) "success" if response sent to modem.

---

### Configuration Context

The behavior of some API commands and the availability of certain parameters can be influenced by:

- **`./zteconfig/default_parameter`**: Baseline system defaults.
- **`./zte_web/web/copy/custom_parameter`**: Operator/deployment specific overrides.
- **`./zte_web/web/js/config/config.js`**: General UI behavior flags.
- **`./zte_web/web/js/config/[DEVICE_MODEL]/config.js`**: Device-specific UI flags.

For example, `HAS_MULTI_SSID` in `config.js` determines if multi-SSID related parameters are relevant. `IPV6_SUPPORT` affects APN and network information.

---

### Note:

This documentation is an extensive interpretation based on frontend JavaScript analysis. The exact API behavior, parameter names, command availability, and response structures can vary significantly between device models, firmware versions, and operator customizations. Direct device testing is recommended for verification. Some `goformId`s or `cmd` parameters might be undocumented or used internally by the device firmware for other purposes.
