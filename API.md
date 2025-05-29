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

POST request responses often include a `result` field.

- `result: "success"` or `result: "0"` (e.g., for LOGIN) typically indicates the command was accepted or the operation was successful.
- Other string values or numerical codes in the `result` field usually indicate an error or a specific failure reason (e.g., for LOGIN, `result: "3"` means incorrect password). The exact meaning of error codes can be specific to the `goformId`.

## API Command Examples

---

### 1. Wi-Fi Settings

#### 1.1. Get Basic Wi-Fi Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=m_ssid_enable,SSID1,AuthMode,HideSSID,WPAPSK1,MAX_Access_num,EncrypType,m_SSID,m_AuthMode,m_HideSSID,m_WPAPSK1,m_MAX_Access_num,m_EncrypType,wifi_guest_enable,SSID_guest,AuthMode_guest,HideSSID_guest,WPAPSK_guest,MAX_Access_num_guest,EncrypType_guest` (Guest network parameters may also be included if supported)
  - `multi_data=1`
- **Description:** Retrieves basic Wi-Fi settings for primary (SSID1), multi-SSID (m_SSID/SSID2), and potentially guest networks.
- **Example Response (JSON):**
  ```json
  {
    "m_ssid_enable": "1", // Multi-SSID (SSID2) enabled status (0=disabled, 1=enabled)
    "SSID1": "MyWiFi_SSID1",
    "AuthMode": "WPA2PSK", // e.g., OPEN, SHARED, WPA2PSK, WPAPSKWPA2PSK, WPAWPA2PSKMix, WPA3SAE, WPA2PSKWPA3SAE
    "HideSSID": "0", // SSID broadcast (0=enabled/visible, 1=disabled/hidden)
    "WPAPSK1": "mysecretpassword", // WPA Pre-shared Key for SSID1
    "MAX_Access_num": "32", // Max connected stations for SSID1
    "EncrypType": "AES", // e.g., NONE, TKIP, AES, TKIPCCMP (AES+TKIP)
    "m_SSID": "MyWiFi_SSID2",
    "m_AuthMode": "OPEN",
    "m_HideSSID": "0",
    "m_WPAPSK1": "",
    "m_MAX_Access_num": "5",
    "m_EncrypType": "NONE"
    // ... guest network fields if enabled/supported
  }
  ```

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
- **Example Response (JSON):** `{"result": "success"}` or `{"result": "failure_reason"}`

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
- **Example Response (JSON):** `{"result": "success"}`

#### 1.4. Set Multi-SSID Switch / Guest Wi-Fi Switch

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_INFO` (often used for various Wi-Fi settings)
  - `m_ssid_enable`: (String) "0" to disable multi-SSID (SSID2), "1" to enable
  - `wifi_guest_enable`: (String) "0" to disable guest Wi-Fi, "1" to enable (if supported)
- **Description:** Enables or disables multi-SSID (SSID2) or Guest Wi-Fi functionality.
- **Example Response (JSON):** `{"result": "success"}`

#### 1.5. Get Advanced Wi-Fi Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=WirelessMode,CountryCode,Channel,HT_MCS,wifi_band,wifi_11n_cap,WIFI_SC_CHAN_BANDWIDTH,WIFI_PRIMARY_CH,WIFI_2G_CHANNEL_BONDING,WIFI_5G_CHANNEL_BONDING,wifi_channel_list_24G,wifi_channel_list_5G`
  - `multi_data=1`
- **Description:** Retrieves advanced Wi-Fi settings like mode, country, channel, bandwidth.
- **Example Response (JSON):**
  ```json
  {
    "WirelessMode": "4", // e.g., 0 (802.11b), 1 (802.11g), 2 (802.11n only), 4 (802.11b/g/n), 6 (802.11g/n), 9 (802.11a/n/ac), 11 (802.11b/g/n/ax)
    "CountryCode": "CN", // Country/Region Code
    "Channel": "0", // 0 for Auto, or specific channel number (e.g., "1", "6", "11" for 2.4GHz)
    "HT_MCS": "1", // Modulation and Coding Scheme (MCS) Index or Rate
    "wifi_band": "b", // 'a' for 5GHz, 'b' for 2.4GHz. Some devices might use '0' (2.4GHz), '1' (5GHz)
    "wifi_11n_cap": "0", // Channel Bandwidth for 2.4GHz: 0 for 20MHz, 1 for 20/40MHz
    "WIFI_SC_CHAN_BANDWIDTH": "0", // Channel Bandwidth for 5GHz: 0 (20MHz), 1 (40MHz), 2 (80MHz), 3 (160MHz), 4 (80+80MHz) - if 5GHz supported
    "WIFI_PRIMARY_CH": "1", // Primary channel if bonding is used
    "WIFI_2G_CHANNEL_BONDING": "0", // 0 (20MHz), 1 (40MHz above), 2 (40MHz below)
    "wifi_channel_list_24G": "1,2,3,4,5,6,7,8,9,10,11,12,13", // Available channels for 2.4GHz
    "wifi_channel_list_5G": "36,40,44,48,149,153,157,161,165" // Available channels for 5GHz
  }
  ```

#### 1.6. Set Advanced Wi-Fi Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_INFO` (Common goformId for many Wi-Fi settings)
  - `wifiMode`: (String) Wireless mode (e.g., "4")
  - `countryCode`: (String) Country code (e.g., "CN")
  - `wifi_band`: (String) Wi-Fi band ('a' or 'b', or '0'/'1') - if supported
  - `selectedChannel`: (String) Channel number (e.g., "6") or "auto" (or "0" for auto)
  - `abg_rate`: (String) Rate (if applicable for the mode)
  - `wifi_11n_cap`: (String) Bandwidth for 2.4GHz ('0' or '1') - if supported
  - `WIFI_SC_CHAN_BANDWIDTH`: (String) Bandwidth for 5GHz ('0'-'4') - if supported
- **Description:** Modifies advanced Wi-Fi settings.
- **Example Response (JSON):** `{"result": "success"}`

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
    "WscModeOption": "0", // WPS Flag/Enable (0=off, 1=on/active)
    "AuthMode": "WPA2PSK",
    "RadioOff": "1", // Wi-Fi radio status (1=on, 0=off). If RadioOff=0, Wi-Fi is disabled.
    "EncrypType": "AES",
    "wps_mode": "PIN", // Current WPS mode (e.g., PIN, PBC)
    "WPS_SSID": "MyWiFi_SSID1", // Target SSID for WPS
    "m_ssid_enable": "0",
    "SSID1": "MyWiFi_SSID1",
    "m_SSID": "MyWiFi_SSID2",
    "m_EncrypType": "NONE",
    "WscStatus": "0", // WPS Status: 0 (Idle), 1 (WPS Process), 2 (Success), 3 (Overlap), 4 (Fail), 5 (Timeout)
    "wps_trigger_method": "wps_hw_pb" // How WPS was last triggered (e.g., wps_hw_pb, wps_sw_pb, wps_sw_pin)
  }
  ```

#### 1.8. Start WPS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=WIFI_WPS_SET`
  - `WPS_SSID`: (String) The SSID to use for WPS (e.g., "SSID1", "SSID2")
  - `wps_mode`: (String) "PIN" or "PBC"
  - `wps_pin`: (String) The PIN code if `wps_mode` is "PIN" (typically 8 digits)
- **Description:** Initiates the WPS process. Frontend polls `WscStatus` to check progress.
- **Example Response (JSON):** `{"result": "success"}`

#### 1.9. Get Wi-Fi Sleep Mode / Range Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sysIdleTimeToSleep,wifi_coverage`
  - `multi_data=1`
- **Description:** Retrieves Wi-Fi sleep mode timeout and Wi-Fi coverage/range setting.
- **Example Response (JSON):**
  ```json
  {
    "sysIdleTimeToSleep": "10", // Time in minutes, -1 or 0 for Never Sleep
    "wifi_coverage": "middle" // Wi-Fi range/coverage: "short", "middle", "long"
  }
  ```

#### 1.10. Set Wi-Fi Sleep Mode / Range Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Sleep Mode):**
  - `goformId=SET_WIFI_SLEEP_INFO`
  - `sysIdleTimeToSleep`: (String) Sleep timeout in minutes (e.g., "5", "10", "-1" for never)
- **Form Data (Range/Coverage):**
  - `goformId=SET_WIFI_COVERAGE`
  - `wifi_coverage`: (String) "short", "middle", or "long"
- **Description:** Sets the Wi-Fi sleep mode timeout or coverage.
- **Example Response (JSON):** `{"result": "success"}`

#### 1.11. AP Station Mode (Internet Wi-Fi / Wi-Fi Repeater/Extender)

- **Description:** Allows the device to connect to an upstream Wi-Fi network and share its internet.
- **Get AP Station Basic Settings:**
  - `cmd=ap_station_enable,ap_station_status,ap_station_ssid,ap_station_mode,ap_station_channel,ap_station_auth_mode,ap_station_encrypt_type,internet_wifi_switch_select`
  - Response example: `{"ap_station_enable": "1", "ap_station_status": "connected", "ap_station_ssid": "UpstreamWiFi", ...}`
- **Set AP Station Basic Settings:**
  - `goformId=SET_AP_STATION_BASIC`
  - Form Data: `ap_station_enable` ("0" or "1"), `internet_wifi_switch_select` ("wifi" or "wwan")
- **Get Hotspot List (Saved Upstream Networks):**
  - `cmd=ap_station_list`
  - Response: Array of saved hotspot objects.
- **Search for Hotspots:**
  - `goformId=AP_STATION_SEARCH_HOTSPOT` (Initiates scan)
  - Poll with `cmd=ap_station_scan_status` (0=idle, 1=scanning, 2=success, 3=fail)
  - Then get results with `cmd=ap_station_scan_list`
- **Save/Connect to Hotspot:**
  - `goformId=AP_STATION_CONNECT`
  - Form Data: `connect_ssid`, `connect_key`, `connect_auth_mode`, `connect_encrypt_type`, `save_to_list` ("0" or "1")
- **Delete Saved Hotspot:**
  - `goformId=AP_STATION_DELETE`
  - Form Data: `delete_ssid`
- **Disconnect from Hotspot:**
  - `goformId=AP_STATION_DISCONNECT`

---

### 2. Network Settings

#### 2.1. Get Network Selection Info

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=current_network_mode,m_netselect_save,net_select_mode,m_netselect_contents,net_select,ppp_status,modem_main_state,lte_band_lock,wcdma_band_lock,gsm_band_lock,nr_band_lock,lte_band_list,wcdma_band_list,gsm_band_list,nr_band_list,m_netselect_status,m_netselect_result`
  - `multi_data=1`
- **Description:** Retrieves current network mode, selection preferences, available networks (if scanned), band lock info, and status of scan/registration attempts.
- **Example Response (JSON):**
  ```json
  {
    "current_network_mode": "LTE", // Current registered RAT (e.g., GSM, WCDMA, LTE, NRSA, NRENDC)
    "m_netselect_save": "NETWORK_auto", // Saved preference for network selection
    "net_select_mode": "0", // Network selection mode (0=auto, 1=manual)
    // m_netselect_contents format: state,ShortName,Numeric(MCCMNC),Rat;state,ShortName,Numeric,Rat;...
    // state: 0=Unknown, 1=Available, 2=Current, 3=Forbidden
    // Rat: 0=2G, 2=3G, 7=4G/LTE, 11=5G NR
    "m_netselect_contents": "2,ProviderA,46000,7;1,ProviderB,46001,2",
    "net_select": "NETWORK_auto", // Current network selection preference
    "ppp_status": "ppp_connected", // e.g., ppp_disconnected, ppp_connecting, ppp_connected
    "modem_main_state": "modem_init_complete", // Modem's operational state
    "lte_band_lock": "all", // Currently locked LTE bands (e.g., "all", "B1", "B3;B7")
    "wcdma_band_lock": "all",
    "nr_band_lock": "all",
    "lte_band_list": "B1,B3,B7,B20,B28,B38,B40,B41", // Supported LTE bands by device
    "m_netselect_status": "0", // Network scan status: 0=idle, 1=scanning, 2=success, 3=fail
    "m_netselect_result": "0" // Manual registration result: 0=idle/success, 1=fail
  }
  ```

#### 2.2. Set Network Bearer Preference (Network Mode)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_BEARER_PREFERENCE`
  - `BearerPreference`: (String) e.g., "NETWORK_auto", "Only_LTE", "Only_WCDMA", "Only_GSM", "Only_NR"
  - `lte_band_lock`: (String) Semicolon-separated LTE bands (e.g., "B1;B3") or "all" or "none".
  - `wcdma_band_lock`: (String) Semicolon-separated WCDMA bands (e.g., "2100M;900M") or "all" or "none".
  - `gsm_band_lock`: (String) Semicolon-separated GSM bands or "all" or "none".
  - `nr_band_lock`: (String) Semicolon-separated NR bands or "all" or "none".
- **Description:** Sets the preferred network mode (RAT) and locks specific frequency bands.
- **Example Response (JSON):** `{"result": "success"}`

#### 2.3. Scan for Networks

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SCAN_NETWORK`
- **Description:** Initiates a scan for available mobile networks. Poll `m_netselect_status` for completion, then get results from `m_netselect_contents`.
- **Example Response (JSON):** `{"result": "success"}` (Indicates scan started)

#### 2.4. Set Network (Manual Registration)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_NETWORK`
  - `NetworkNumber`: (String) MCCMNC of the network to register to (e.g., "46000")
  - `Rat`: (String) Radio Access Technology (e.g., "0" for 2G, "2" for 3G, "7" for 4G/LTE, "11" for 5G NR)
- **Description:** Attempts to manually register to the specified network. Poll `m_netselect_result` for success/failure.
- **Example Response (JSON):** `{"result": "success"}` (Indicates registration attempt started)

#### 2.5. Get APN Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=APN_config0,...,APN_config19,ipv6_APN_config0,...,ipv6_APN_config19,m_profile_name,profile_name,wan_dial,apn_select,pdp_type,pdp_select,pdp_addr,index,Current_index,apn_auto_config,ipv6_apn_auto_config,apn_mode,wan_apn,ppp_auth_mode,ppp_username,ppp_passwd,dns_mode,prefer_dns_manual,standby_dns_manual,ipv6_wan_apn,ipv6_pdp_type,ipv6_ppp_auth_mode,ipv6_ppp_username,ipv6_ppp_passwd,ipv6_dns_mode,ipv6_prefer_dns_manual,ipv6_standby_dns_manual` (Number of APN_configX fields depends on device capability)
  - `multi_data=1`
- **Description:** Retrieves APN profiles and current settings. APN_configX format: `ProfileName($)APNName($)APNSelectMode($)DialNumber($)AuthMode($)Username($)Password($)PDPType($)DNSMode($)PrimaryDNS($)SecondaryDNS($)`.
- **Example Response (JSON Snippet):**
  ```json
  {
    "APN_config0": "Profile1($)internet($)manual($)*99#($)pap($)user($)pass($)IP($)auto($)($)auto($)($)",
    "m_profile_name": "Profile1", // Name of the currently active profile
    "apn_mode": "manual", // "auto" or "manual"
    "wan_apn": "internet", // APN of the active connection
    "ppp_auth_mode": "pap", // "none", "pap", "chap"
    "ppp_username": "user",
    "ppp_passwd": "password", // Often masked or not returned for security
    "dns_mode": "auto", // "auto" or "manual"
    "prefer_dns_manual": "8.8.8.8",
    "standby_dns_manual": "8.8.4.4",
    "pdp_type": "IP" // "IP", "IPV6", "IPV4V6"
    // ... ipv6 fields if IPV6_SUPPORT is true
  }
  ```

#### 2.6. Add/Edit APN Profile

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Example for IPv4):**
  - `goformId=APN_PROC_EX` (or `APN_PROC`)
  - `apn_action`: "save" (for new) or "set_default" with `set_default_flag=0` (for edit and set as default)
  - `apn_mode`: "manual"
  - `profile_name`: (String)
  - `wan_dial`: (String) e.g., "\*99#" or empty
  - `apn_select`: "manual"
  - `pdp_type`: (String) "IP", "IPV6", or "IPV4V6"
  - `index`: (String) Index of the profile to edit (0-19), or next available for new.
  - `wan_apn`: (String) APN name
  - `ppp_auth_mode`: (String) "none", "pap", "chap"
  - `ppp_username`: (String)
  - `ppp_passwd`: (String)
  - `dns_mode`: (String) "auto" or "manual"
  - `prefer_dns_manual`: (String) Primary DNS (if dns_mode is manual)
  - `standby_dns_manual`: (String) Secondary DNS (if dns_mode is manual)
  - _(Similar parameters exist for IPv6, prefixed with `ipv6_`)_
- **Description:** Adds a new APN profile or edits an existing one.
- **Example Response (JSON):** `{"result": "success"}`

#### 2.7. Delete APN Profile

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=APN_PROC_EX` (or `APN_PROC`)
  - `apn_action`: "delete"
  - `apn_mode`: "manual"
  - `index`: (String) Index of the profile to delete.
- **Example Response (JSON):** `{"result": "success"}`

#### 2.8. Set Default APN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=APN_PROC_EX` (or `APN_PROC`)
  - `apn_action`: "set_default"
  - `set_default_flag`: "1" (to set an existing profile as default)
  - `pdp_type`: (String) The PDP type of the profile being set as default.
  - `index`: (String) Index of the profile to set as default.
  - `apn_mode`: "manual" (if setting a manual profile) or "auto"
- **Example Response (JSON):** `{"result": "success"}`

#### 2.9. Set Connection Mode (Auto/Manual Dial) & Roaming

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_CONNECTION_MODE`
  - `ConnectionMode`: (String) "auto_dial" or "manual_dial"
  - `roam_setting_option`: (String) "on" (allow roaming) or "off" (disallow roaming)
- **Example Response (JSON):** `{"result": "success"}`

#### 2.10. Connect/Disconnect WAN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=CONNECT_NETWORK` (To connect)
  - `goformId=DISCONNECT_NETWORK` (To disconnect)
- **Description:** Manually initiates or terminates the WAN data connection if `ConnectionMode` is "manual_dial".
- **Example Response (JSON):** `{"result": "success"}`

---

### 3. SMS (Short Message Service)

#### 3.1. Get SMS Messages

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sms_data_total`
  - `page`: (String) Page number (e.g., "0")
  - `data_per_page`: (String) Number of messages per page (e.g., "10", "500")
  - `mem_store`: (String) Message store type ("0" for SIM, "1" for device/NV, "2" for all)
  - `tags`: (String) Message tags/status ("0"=read, "1"=unread, "2"=sent, "3"=failed/unsent, "4"=draft, "5"=all inbox, "6"=all sent, "10"=all messages)
  - `order_by`: (String) e.g., "order by id desc"
- **Description:** Retrieves a list of SMS messages.
- **Example Response (JSON):**
  ```json
  {
    "messages": [
      // This key might vary, or data might be at the root
      {
        "id": "60", // Message index/ID in its store
        "number": "+1234567890", // Sender/Recipient number
        "tag": "0", // 0=read, 1=unread, 2=sent, 3=unsent, 4=draft
        "content": "48656C6C6F20576F726C64", // Hex-encoded message content
        "date": "13,08,07,10,30,15", // YY,MM,DD,HH,MM,SS (Timestamp of message)
        "draft_group_id": "", // Used for multi-recipient drafts
        "encode_type": "GSM7_default" // "GSM7_default" or "UNICODE"
      }
    ],
    "sms_nv_total": "50", // Total messages on device
    "sms_nv_unread": "2",
    "sms_sim_total": "10", // Total messages on SIM
    "sms_sim_unread": "1"
  }
  ```

#### 3.2. Send SMS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SEND_SMS`
  - `Number`: (String) Recipient phone number(s), semicolon-separated for multiple.
  - `sms_time`: (String) Current time string (format: `YY;MM;DD;HH;MM;SS;TZ` e.g. `13;08;07;10;30;15;+08`)
  - `MessageBody`: (String) Hex-encoded message content.
  - `ID`: (String) Message ID (usually -1 for new message, or draft ID to send a draft).
  - `encode_type`: (String) "GSM7_default" or "UNICODE".
- **Description:** Sends an SMS. Poll `sms_cmd_status_info` (values: 0=idle, 1=sending, 2=success, 3=fail).
- **Example Response (JSON):** `{"result": "success"}` (Indicates send attempt started)

#### 3.3. Save SMS Draft

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SAVE_SMS`
  - `SMSMessage`: (String) Hex-encoded message content.
  - `SMSNumber`: (String) Recipient phone number(s), semicolon-separated.
  - `Index`: (String) -1 for new draft, or existing draft ID to overwrite.
  - `encode_type`: (String) "GSM7_default" or "UNICODE".
  - `sms_time`: (String) Current time string.
  - `draft_group_id`: (String) Group ID for multi-recipient drafts.
- **Example Response (JSON):** `{"result": "success"}`

#### 3.4. Delete SMS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=DELETE_SMS`
  - `msg_id`: (String) Semicolon-separated list of message IDs to delete (e.g., "60;61;").
  - `mem_store`: (String) "0" for SIM, "1" for device (if IDs are not globally unique).
- **Example Response (JSON):** `{"result": "success"}`

#### 3.5. Set SMS as Read

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_MSG_READ`
  - `msg_id`: (String) Semicolon-separated list of message IDs to mark as read.
  - `tag`: "0" (to mark as read)
- **Example Response (JSON):** `{"result": "success"}`

#### 3.6. Get SMS Settings (Center Number, Capacity, etc.)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sms_parameter_info,sms_sim_capacity,sms_nv_capacity,sms_nv_total,sms_sim_total`
    - `sms_parameter_info`: Retrieves a bundle of SMS operational parameters.
    - `sms_sim_capacity`: Fetches the maximum number of SMS messages that can be stored on the SIM card.
    - `sms_nv_capacity`: Fetches the maximum number of SMS messages that can be stored on the device's non-volatile memory.
    - `sms_nv_total`: Retrieves the current count of SMS messages stored on the device.
    - `sms_sim_total`: Retrieves the current count of SMS messages stored on the SIM card.
  - `multi_data=1`
- **Description:** Retrieves SMS service center number (SMSC), default message validity period, delivery report settings, and storage capacity information for both SIM and device. This information is crucial for understanding the device's SMS capabilities and current state.
- **Example Response (JSON):**
  ```json
  {
    "sms_para_sca": "+12345678900", // SMS Center Number (SMSC) configured in the device.
    "sms_para_mem_store": "native", // Preferred storage location for new SMS messages ("native" for device, "sim" for SIM card).
    "sms_para_status_report": "0", // Delivery report setting (0=off, 1=on). If on, the network attempts to send a report back on message delivery.
    // SMS Validity Period: Defines how long the network will attempt to deliver the message.
    // Common values: "143" (12 hours), "167" (1 day), "173" (1 week), "255" (maximum, network-dependent).
    "sms_para_validity_period": "255",
    "sms_sim_capacity": "50", // Maximum number of SMS messages the SIM card can store.
    "sms_nv_capacity": "100", // Maximum number of SMS messages the device memory can store.
    "sms_nv_total": "23", // Current number of SMS messages stored on the device.
    "sms_sim_total": "5" // Current number of SMS messages stored on the SIM.
  }
  ```
- **Details:**
  - The `sms_parameter_info` is a key command that bundles critical operational settings. The SMSC (`sms_para_sca`) must be correctly configured for sending SMS. The `sms_para_mem_store` indicates where the device prioritizes saving new messages. `sms_para_status_report` allows users to request confirmation of message delivery. `sms_para_validity_period` is important for ensuring messages are attempted for a reasonable duration if the recipient is initially unavailable.
  - Capacity information (`sms_sim_capacity`, `sms_nv_capacity`, `sms_nv_total`, `sms_sim_total`) is vital for the UI to inform the user about storage limits and potentially warn them if storage is nearing full.

#### 3.7. Set SMS Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_MESSAGE_CENTER`
  - `save_time`: (String) Validity period value (e.g., "255")
  - `MessageCenter`: (String) SMSC number
  - `status_save`: (String) Delivery report ("0" or "1")
  - `save_location`: (String) "native" (device) or "sim"
- **Example Response (JSON):** `{"result": "success"}`

---

### 4. Device Status & Information

#### 4.1. Get General Status Information (Frequently Polled)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters (Example batch, many can be combined):**
  - `cmd=modem_main_state,pin_status,loginfo,new_version_state,current_upgrade_state,is_mandatory,sms_received_flag,sts_received_flag,signalbar,network_type,network_provider,ppp_status,EX_SSID1,ex_wifi_status,EX_wifi_profile,m_ssid_enable,sms_unread_num,RadioOff,simcard_roam,lan_ipaddr,station_mac,battery_charging,battery_vol_percent,battery_pers,spn_display_flag,plmn_display_flag,spn_name_data,spn_b1_flag,spn_b2_flag,realtime_tx_bytes,realtime_rx_bytes,realtime_time,realtime_tx_thrpt,realtime_rx_thrpt,monthly_rx_bytes,monthly_tx_bytes,monthly_time,date_month,data_volume_limit_switch,data_volume_limit_size,data_volume_alert_percent,data_volume_limit_unit,roam_setting_option,upg_roam_switch,hplmn,wan_ipaddr,ipv6_wan_ipaddr,dns_mode,prefer_dns_manual,standby_dns_manual,static_wan_ipaddr,static_wan_netmask,static_wan_gateway,static_wan_primary_dns,static_wan_secondary_dns,op_mode,wifi_cur_band,wifi_conn_status,wifi_sta_count,wifi_guest_sta_count`
  - `multi_data=1`
- **Description:** Retrieves a wide range of real-time status.
- **Example Response (JSON Snippet):**
  ```json
  {
    "modem_main_state": "modem_init_complete", // e.g., modem_undetected, modem_detected, modem_sim_error, modem_waitpin, modem_waitpuk, modem_registered, modem_init_complete
    "pin_status": "0", // PIN status: 0=Disabled/OK, 1=PIN Required, 2=PUK Required, 3=SIM Card Error/Not Ready, 4=PIN_DISABLE(PIN verification disabled)
    "loginfo": "ok", // Login status ("ok" or "no")
    "signalbar": "4", // Signal strength (0-5)
    "network_type": "LTE", // e.g., NO_SERVICE, GSM, GPRS, EDGE, WCDMA, HSDPA, HSUPA, HSPA_PLUS, DC_HSPA_PLUS, LTE, LTE_CA, NRSA, NRENDC
    "network_provider": "My Operator", // Current network operator name
    "ppp_status": "ppp_connected", // ppp_disconnected, ppp_connecting, ppp_connected
    "sms_unread_num": "3",
    "RadioOff": "1", // Wi-Fi radio status (1=on, 0=off)
    "simcard_roam": "mInternal", // Roaming status ("mInternal"=not roaming, "mRoaming"=roaming)
    "battery_charging": "0", // 0=not charging, 1=charging, 2=charge complete (if applicable)
    "battery_vol_percent": "85", // Battery percentage as string
    "battery_pers": "4", // Battery level indicator (e.g., 0-4 or 0-5 scale)
    "wan_ipaddr": "100.64.10.20",
    "ipv6_wan_ipaddr": "2001:db8::1",
    "op_mode": "LTE_Router" // Operational mode of the device
  }
  ```

#### 4.2. Get Detailed Device Information

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=wifi_coverage,m_ssid_enable,imei,web_version,wa_inner_version,hardware_version,MAX_Access_num,SSID1,m_SSID,m_HideSSID,m_MAX_Access_num,lan_ipaddr,wan_active_band,mac_address,msisdn,LocalDomain,wan_ipaddr,ipv6_wan_ipaddr,ipv6_pdp_type,pdp_type,ppp_status,sim_iccid,sim_imsi,rmcc,rmnc,rssi,rscp,lte_rsrp,ecio,lte_snr,network_type,lte_rssi,lac_code,cell_id,lte_pci,dns_mode,prefer_dns_manual,standby_dns_manual,prefer_dns_auto,standby_dns_auto,ipv6_dns_mode,ipv6_prefer_dns_manual,ipv6_standby_dns_manual,ipv6_prefer_dns_auto,ipv6_standby_dns_auto,model_name,sw_version,fw_version,hw_version,DeviceName,serial_number,lte_ca_pcell_band,lte_ca_pcell_bw,lte_ca_scell_band,lte_ca_scell_bw,lte_ca_scell_state,nr_sub_type,nr_mode,nr_status,nr_band,nr_pci,nr_rsrp,nr_sinr`
  - `multi_data=1`
- **Description:** Retrieves detailed hardware, software, network interface, and signal quality information.
- **Example Response (JSON Snippet):**
  ```json
  {
    "imei": "123456789012345",
    "web_version": "WEB_BLERUSMF90V1.0.0B03", // Web UI version
    "wa_inner_version": "FW_VERSION_XYZ", // Firmware version
    "hardware_version": "HW_V1.0",
    "lan_ipaddr": "192.168.0.1",
    "mac_address": "00:11:22:AA:BB:CC", // LAN MAC address
    "msisdn": "+19876543210", // Phone number associated with SIM
    "sim_iccid": "8901234567890123456F",
    "sim_imsi": "460001234567890",
    "rmcc": "460", // Registered MCC
    "rmnc": "00", // Registered MNC
    "rssi": "-75", // Received Signal Strength Indicator (dBm)
    "rscp": "-80", // WCDMA Received Signal Code Power (dBm)
    "lte_rsrp": "-90", // LTE Reference Signal Received Power (dBm)
    "ecio": "-12", // WCDMA Ec/Io (dB)
    "lte_snr": "15", // LTE Signal to Noise Ratio (dB)
    "cell_id": "12345",
    "lte_pci": "100",
    "model_name": "MF823" // Device model name
  }
  ```

#### 4.3. Get Currently Attached Wi-Fi Devices

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=station_list`
- **Description:** Retrieves a list of devices currently connected to the Wi-Fi hotspot.
- **Example Response (JSON):**
  ```json
  {
    "station_list": [
      // This key might be different, e.g., "connected_devices"
      {
        "mac_addr": "00:23:CD:AC:08:7E",
        "hostname": "MyLaptop",
        "ip_addr": "192.168.0.101",
        "conn_time": "3600"
      }, // conn_time in seconds
      {
        "mac_addr": "34:E0:CF:E0:B2:99",
        "hostname": "android-device",
        "ip_addr": "192.168.0.102",
        "conn_time": "7200"
      }
    ]
  }
  ```

#### 4.4. Get Traffic Statistics

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=realtime_tx_bytes,realtime_rx_bytes,realtime_time,realtime_tx_thrpt,realtime_rx_thrpt,monthly_rx_bytes,monthly_tx_bytes,monthly_time,date_month`
  - `multi_data=1`
- **Description:** Retrieves data usage statistics.
- **Example Response (JSON):**
  ```json
  {
    "realtime_tx_bytes": "102400", // Bytes sent in current session
    "realtime_rx_bytes": "204800", // Bytes received in current session
    "realtime_time": "3600", // Duration of current session in seconds
    "realtime_tx_thrpt": "80000", // Current TX speed in bps
    "realtime_rx_thrpt": "160000", // Current RX speed in bps
    "monthly_tx_bytes": "102400000",
    "monthly_rx_bytes": "204800000",
    "monthly_time": "360000",
    "date_month": "05" // Current month for statistics (e.g., "01" to "12")
  }
  ```

#### 4.5. Set Traffic Alert / Data Limit

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_TRAFFIC_ALERT`
  - `data_volume_limit_switch`: (String) "0" (off) or "1" (on)
  - `data_volume_limit_size`: (String) Data limit value
  - `data_volume_limit_unit`: (String) "MB" or "GB"
  - `data_volume_alert_percent`: (String) Percentage of limit to trigger alert (e.g., "80")
- **Description:** Configures data usage limits and alerts.
- **Example Response (JSON):** `{"result": "success"}`

#### 4.6. Clear Traffic Data

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=CLEAR_TRAFFIC_DATA`
- **Description:** Resets traffic statistics.
- **Example Response (JSON):** `{"result": "success"}`

---

### 5. System Administration

#### 5.1. Login

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=LOGIN`
  - `password`: (String) Administrator password.
    - **Encoding:** The password might be sent in plain text or Base64 encoded, depending on the `PASSWORD_ENCODE` flag in `js/config/config.js`. If `PASSWORD_ENCODE` is true, the frontend JavaScript (`js/login.js`) will typically Base64 encode the password before sending it.
- **Description:** Authenticates the user to access the web UI. A successful login is usually a prerequisite for most other POST operations that require an `AD` (Authentication Data) token. The `AD` token itself is generated by the frontend JavaScript after a successful login and included in subsequent authenticated requests; it's not part of the `LOGIN` request's form data. The login process may also interact with SIM PIN/PUK status if the SIM is locked.
- **Related Configuration:**
  - `js/config/config.js`:
    - `HAS_LOGIN`: If false, the login page might be bypassed.
    - `PASSWORD_ENCODE`: (Boolean) Determines if the password should be Base64 encoded by the client before submission.
    - `LOGIN_SECURITY_SUPPORT`: (Boolean) Enables features like account lockout after multiple failed attempts.
    - `MAX_LOGIN_COUNT`: (Number) Defines the maximum number of incorrect login attempts before the account is temporarily locked.
  - `custom_parameter` / `default_parameter`:
    - `admin_Password`: Defines the default administrator password (e.g., "admin").
- **Example Response (JSON):**
  - Success: `{"result": "0"}` (Indicates successful authentication)
  - Failure (Incorrect Password): `{"result": "3"}` (Or another numeric/string error code specific to incorrect credentials)
  - Failure (Account Locked): `{"result": "account_locked_result_code"}` (A specific code indicating the account is locked due to too many failed attempts, e.g., "4" or a string like "ERROR_LOGIN_ACCOUNT_LOCKED"). The exact code can vary.
  - Other errors: Other numeric or string codes might indicate different failure reasons (e.g., "ERROR_SYSTEM_BUSY").
- **Workflow:**
  1. User enters password in the UI.
  2. Frontend JS (`js/login.js`) potentially Base64 encodes the password if `PASSWORD_ENCODE` is true.
  3. The `LOGIN` request is sent.
  4. Backend validates credentials.
  5. If successful, the backend establishes a session. The frontend, upon receiving a success response, typically navigates to the main dashboard and starts including the `AD` token in subsequent authenticated POST requests.

#### 5.2. Logout

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=LOGOUT`
- **Example Response (JSON):** `{"result": "success"}`

#### 5.3. Change Admin Password

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=CHANGE_PASSWORD`
  - `oldPassword`: (String) Current administrator password
  - `newPassword`: (String) New administrator password
- **Example Response (JSON):** `{"result": "success"}`

#### 5.4. Get PIN Status/Attempts

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=pinnumber,pin_status,puknumber,pin_lock_flag`
  - `multi_data=1`
- **Description:** Retrieves PIN/PUK attempts remaining and status.
- **Example Response (JSON):**
  ```json
  {
    "pinnumber": "3", // PIN attempts left
    "pin_status": "0", // 0=Disabled/OK, 1=PIN Required, 2=PUK Required, 3=SIM Error, 4=PIN verification disabled by user
    "puknumber": "10", // PUK attempts left
    "pin_lock_flag": "0" // 0=Not locked, 1=PIN locked, 2=PUK locked
  }
  ```

#### 5.5. Enter PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=ENTER_PIN`
  - `PinNumber`: (String) The PIN code.
- **Example Response (JSON):** `{"result": "success"}` or `{"result": "pin_error_code"}`

#### 5.6. Enter PUK and Set New PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=ENTER_PUK`
  - `PUKNumber`: (String) The PUK code.
  - `PinNumber`: (String) The new PIN code to set.
- **Example Response (JSON):** `{"result": "success"}` or `{"result": "puk_error_code"}`

#### 5.7. Enable/Disable/Change PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Enable PIN):**
  - `goformId=ENABLE_PIN`
  - `OldPinNumber`: (String) Current PIN (if PIN was previously set and disabled, or to verify identity)
- **Form Data (Disable PIN):**
  - `goformId=DISABLE_PIN`
  - `OldPinNumber`: (String) Current PIN
- **Form Data (Change PIN):**
  - `goformId=CHANGE_PIN` (or sometimes `ENABLE_PIN` with `NewPinNumber`)
  - `OldPinNumber`: (String) Current PIN
  - `NewPinNumber`: (String) New PIN
- **Example Response (JSON):** `{"result": "success"}`

#### 5.8. Get LAN Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=lan_ipaddr,lan_netmask,mac_address,dhcpEnabled,dhcpStart,dhcpEnd,dhcpLease_hour,LocalDomain`
  - `multi_data=1`
- **Example Response (JSON):**
  ```json
  {
    "lan_ipaddr": "192.168.0.1",
    "lan_netmask": "255.255.255.0",
    "mac_address": "AA:BB:CC:11:22:33",
    "dhcpEnabled": "1", // 1=enabled, 0=disabled
    "dhcpStart": "192.168.0.100",
    "dhcpEnd": "192.168.0.200",
    "dhcpLease_hour": "24", // Lease time in hours
    "LocalDomain": "zte.com" // Local domain name for DHCP clients
  }
  ```

#### 5.9. Set LAN (DHCP) Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=DHCP_SETTING`
  - `lanIp`: (String) Device LAN IP address
  - `lanNetmask`: (String) LAN subnet mask
  - `lanDhcpType`: (String) "SERVER" to enable DHCP, "DISABLE" to disable
  - `dhcpStart`: (String) DHCP pool start IP (if enabled)
  - `dhcpEnd`: (String) DHCP pool end IP (if enabled)
  - `dhcpLease`: (String) DHCP lease time in hours (if enabled)
  - `LocalDomain`: (String) Local domain name
- **Example Response (JSON):** `{"result": "success"}`

#### 5.10. Restore Factory Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=RESTORE_FACTORY_SETTINGS`
- **Description:** Resets device to factory defaults. Poll `restore_flag` (0=idle, 1=in progress, 2=done).
- **Example Response (JSON):** `{"result": "success"}` (Indicates process started)

#### 5.11. Restart Device

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=REBOOT_DEVICE`
- **Description:** Restarts the device.
- **Example Response (JSON):** `{"result": "success"}` (Indicates process started)

#### 5.12. Set Web UI Language

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WEB_LANGUAGE`
  - `Language`: (String) Language code (e.g., "en", "ru", "es")
- **Example Response (JSON):** `{"result": "success"}`

#### 5.13. Get Fast Boot Setting

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:** `cmd=fast_boot_enable`, `multi_data=1`
- **Response:** `{"fast_boot_enable": "0"}` (0=disabled, 1=enabled)

#### 5.14. Set Fast Boot Setting

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=SET_FAST_BOOT`, `fast_boot_enable` ("0" or "1")
- **Response:** `{"result": "success"}`

---

### 6. USSD (Unstructured Supplementary Service Data)

#### 6.1. Send USSD Command / Reply to USSD

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Send):**
  - `goformId=USSD_PROCESS`
  - `USSD_operator`: "ussd_send"
  - `USSD_send_number`: (String) The USSD code (e.g., "\*100#")
  - `USSD_encode_type`: (String) e.g., "GSM7_default" or "UCS2"
- **Form Data (Reply):**
  - `goformId=USSD_PROCESS`
  - `USSD_operator`: "ussd_reply"
  - `USSD_reply_number`: (String) The reply to the USSD prompt.
  - `USSD_encode_type`: (String)
- **Description:** Sends USSD or replies. Poll `ussd_write_flag` (0=idle, 1=waiting response), then `ussd_data_info`.
- **Example Response (JSON):** `{"result": "success"}`

#### 6.2. Cancel USSD Session

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=USSD_PROCESS`
  - `USSD_operator`: "ussd_cancel"
- **Example Response (JSON):** `{"result": "success"}`

#### 6.3. Get USSD Data Info (After Sending/Replying)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=ussd_data_info,ussd_action,ussd_write_flag`
  - `multi_data=1`
- **Description:** Retrieves USSD response content and action required.
- **Example Response (JSON):**
  ```json
  {
    "ussd_data": "WW91ciBiYWxhbmNlIGlzICQxMC4wMA==", // Base64 encoded USSD message
    "ussd_action": "0", // Action from network: 0=Display only, session ended; 1=Request user input, session active; 2=Network initiated session ended; 3=Other network notification; 4=Session timed out
    "ussd_write_flag": "0" // 0=Idle/Response received, 1=Waiting for network response
  }
  ```

---

### 7. SD Card & DLNA

#### 7.1. Get SD Card & HTTP Share Configuration

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sdcard_mode_option,sd_card_state,HTTP_SHARE_STATUS,HTTP_SHARE_CARD_USER,HTTP_SHARE_WR_AUTH,HTTP_SHARE_FILE,sd_card_total_size,sd_card_avi_space`
  - `multi_data=1`
- **Example Response (JSON):**
  ```json
  {
    "sdcard_mode_option": "1", // 0=HTTP Share, 1=USB Mode
    "sd_card_state": "1", // 0=No SD, 1=Ready, 2=Invalid/Error, 3=Formatting
    "HTTP_SHARE_STATUS": "Enabled", // "Enabled" or "Disabled"
    "HTTP_SHARE_CARD_USER": "user", // Username for HTTP share (if auth enabled)
    "HTTP_SHARE_WR_AUTH": "readWrite", // "readOnly" or "readWrite"
    "HTTP_SHARE_FILE": "/mmc2", // Path being shared (e.g., /mmc2 for whole card, or /mmc2/photos)
    "sd_card_total_size": "15800000000", // Total size in bytes
    "sd_card_avi_space": "10000000000" // Available space in bytes
  }
  ```

#### 7.2. Set SD Card Mode (USB / HTTP Share)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=HTTPSHARE_MODE_SET`
  - `mode_set`: (String) "http_share_mode" or "usb_mode"
- **Example Response (JSON):** `{"result": "success"}`

#### 7.3. Set SD Card HTTP Sharing Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=HTTPSHARE_AUTH_SET`
  - `HTTP_SHARE_STATUS`: (String) "Enabled" or "Disabled"
  - `HTTP_SHARE_WR_AUTH`: (String) "readOnly" or "readWrite"
  - `HTTP_SHARE_FILE`: (String) Path to share (e.g., "/mmc2/photos")
- **Example Response (JSON):** `{"result": "success"}`

#### 7.4. File Operations (HTTP Share)

- **Get File List:**
  - `cmd=sd_file_list&sd_file_path=/mmc2/MyFolder&page=0&data_per_page=20&sort_type=0&sort_direct=0`
  - Response: JSON array of files/folders with name, type, size, date.
- **Create Folder:**
  - `goformId=HTTPSHARE_CREATE_FOLDER`
  - Form Data: `create_folder_path` (e.g., "/mmc2/NewFolder")
- **Rename File/Folder:**
  - `goformId=HTTPSHARE_RENAME`
  - Form Data: `old_file_path`, `new_file_name`
- **Delete File/Folder:**
  - `goformId=HTTPSHARE_DELETE`
  - Form Data: `delete_file_path` (semicolon-separated for multiple)
- **Upload File:**
  - POST to `/goform/goform_set_cmd_process` (multipart/form-data)
  - `goformId=HTTPSHARE_UPLOAD`
  - `upload_file_path`: (String) Destination path on SD card (e.g., "/mmc2/uploads")
  - `Filename`: (File) The file to upload.
  - Poll `checkUploadFileStatus` for progress.

#### 7.5. Get DLNA Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=dlna_language,dlna_name,dlna_share_audio,dlna_share_video,dlna_share_image,dlna_scan_state,sd_card_state,sdcard_mode_option`
  - `multi_data=1`
- **Example Response (JSON):**
  ```json
  {
    "dlna_language": "english",
    "dlna_name": "MyDLNAServer",
    "dlna_share_audio": "on", // "on" or "off"
    "dlna_share_video": "on",
    "dlna_share_image": "on",
    "dlna_scan_state": "0", // 0=idle, 1=scanning
    "sd_card_state": "1",
    "sdcard_mode_option": "0" // DLNA usually requires HTTP Share mode
  }
  ```

#### 7.6. Set DLNA Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=DLNA_SETTINGS`
  - `dlna_language`: (String)
  - `dlna_name`: (String) DLNA server name
  - `dlna_share_audio`: (String) "on" or "off"
  - `dlna_share_video`: (String) "on" or "off"
  - `dlna_share_image`: (String) "on" or "off"
- **Example Response (JSON):** `{"result": "success"}`

#### 7.7. Rescan DLNA Media

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** `goformId=DLNA_RESCAN`
- **Description:** Initiates a rescan of media files for DLNA. Poll `dlna_scan_state`.
- **Example Response (JSON):** `{"result": "success"}`

---

### 8. Firewall Management

#### 8.1. Get Port Filter Settings

- `cmd=filter_default_policy,filter_enable,filter_rule_list`
- Response: `{"filter_default_policy": "ACCEPT", "filter_enable": "1", "filter_rule_list": [...]}` (list of rule objects)

#### 8.2. Set Port Filter Basic Settings

- `goformId=SET_PORT_FILTER_BASIC`
- Form Data: `filter_default_policy` ("ACCEPT" or "DROP"), `filter_enable` ("0" or "1")

#### 8.3. Add/Edit Port Filter Rule

- `goformId=SET_PORT_FILTER_RULE`
- Form Data: `rule_index` (for edit), `src_ip`, `src_port`, `dst_ip`, `dst_port`, `protocol` ("TCP", "UDP", "BOTH"), `action` ("ACCEPT", "DROP")

#### 8.4. Delete Port Filter Rule(s)

- `goformId=DELETE_PORT_FILTER_RULES`
- Form Data: `rule_indexes` (semicolon-separated)

#### 8.5. Get Port Mapping (Virtual Server) Settings

- `cmd=port_map_enable,port_map_rule_list`
- Response: `{"port_map_enable": "1", "port_map_rule_list": [...]}`

#### 8.6. Add/Edit Port Mapping Rule

- `goformId=SET_PORT_MAP_RULE`
- Form Data: `rule_index` (for edit), `wan_port_range`, `lan_ip_addr`, `lan_port_range`, `protocol` ("TCP", "UDP", "BOTH"), `description`

#### 8.7. Delete Port Mapping Rule(s)

- `goformId=DELETE_PORT_MAP_RULES`
- Form Data: `rule_indexes` (semicolon-separated)

#### 8.8. Get DMZ Settings

- `cmd=dmz_enable,dmz_ip_addr`
- Response: `{"dmz_enable": "0", "dmz_ip_addr": "192.168.0.150"}`

#### 8.9. Set DMZ Settings

- `goformId=SET_DMZ_SETTING`
- Form Data: `dmz_enable` ("0" or "1"), `dmz_ip_addr`

#### 8.10. Get UPnP Settings

- `cmd=upnp_enable`
- Response: `{"upnp_enable": "1"}`

#### 8.11. Set UPnP Settings

- `goformId=SET_UPNP_SETTING`
- Form Data: `upnp_enable` ("0" or "1")

#### 8.12. Get System Security Settings (Remote Management, WAN Ping)

- `cmd=remote_management_enable,wan_ping_filter_enable`
- Response: `{"remote_management_enable": "0", "wan_ping_filter_enable": "1"}`

#### 8.13. Set System Security Settings

- `goformId=SET_SYS_SECURITY`
- Form Data: `remote_management_enable` ("0" or "1"), `wan_ping_filter_enable` ("0" or "1")

---

### 9. Phonebook Management

The Phonebook module allows users to store, manage, and access contact information directly through the device's web interface. It supports operations such as adding, editing, deleting, and viewing contacts. Contacts can typically be stored on both the SIM card and the device's internal memory (NVRAM). The module often integrates with the SMS functionality, allowing users to initiate messages to stored contacts. The availability of this module is typically controlled by the `HAS_PHONEBOOK` flag in `js/config/config.js`.

#### 9.1. Get Phonebook Contacts

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=phonebook_data`: The primary command to fetch phonebook entries.
  - `page`: (String, e.g., "0") Specifies the page number for paginated results. Phonebook lists can be long, so pagination is essential.
  - `data_per_page`: (String, e.g., "10", "50") Number of contacts to retrieve per page.
  - `mem_store`: (String) Defines the storage location to query:
    - `"0"`: SIM card contacts.
    - `"1"`: Device internal memory (NVRAM) contacts.
    - `"2"`: Contacts from all available stores (SIM and Device).
  - `group_id`: (String, Optional) Filters contacts by a specific group ID, if group functionality is supported and implemented. "0" might represent "All groups" or a default group.
  - `order_by`: (String, Optional) Specifies sorting order for the contacts, e.g., `"order by name asc"` (sort by name ascending), `"order by id desc"` (sort by ID descending).
- **Description:** Retrieves a list of contacts based on the specified parameters. The UI (`js/phonebook/phonebook.js`) uses this to populate the contact list, often employing client-side filtering and sorting on the retrieved data, or re-fetching with different `order_by` or filter parameters.
- **Example Response (JSON):**
  ```json
  {
    "contacts": [
      // An array of contact objects
      {
        "id": "1", // Unique identifier for the contact within its memory store
        "name": "John Doe", // Contact's name
        "mobile_phone": "+15551234", // Primary mobile number
        "home_phone": "+15555678", // Home phone number (optional)
        "office_phone": "", // Office phone number (optional)
        "email": "john@example.com", // Email address (optional)
        "group_id": "0", // Group identifier this contact belongs to
        "mem_store": "1" // "0" for SIM, "1" for Device, indicating where this contact is stored
      }
      // ... more contact objects
    ],
    "sim_contact_total": "250", // Total capacity of SIM phonebook
    "sim_contact_used": "20", // Number of contacts currently stored on SIM
    "nv_contact_total": "500", // Total capacity of device (NVRAM) phonebook
    "nv_contact_used": "150" // Number of contacts currently stored on device
  }
  ```
- **Details:**
  - The `pbm_init_state` command (polled by `service.getPhoneBookReady()`) is often checked first to ensure the phonebook system is ready before attempting to fetch contacts.
  - The UI typically provides options to switch between viewing SIM contacts, device contacts, or all contacts, which translates to different `mem_store` values in the API request.

#### 9.2. Add/Edit Phonebook Contact

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SAVE_PHONEBOOK`
  - `Index`: (String)
    - For adding a new contact: `"-1"`.
    - For editing an existing contact: The `id` of the contact to be modified.
  - `pbm_name`: (String) Contact's name.
  - `pbm_number`: (String) Primary mobile number.
  - `pbm_home_number`: (String, Optional) Home phone number.
  - `pbm_office_number`: (String, Optional) Office phone number.
  - `pbm_email`: (String, Optional) Email address.
  - `pbm_group_id`: (String, Optional) Group ID to assign the contact to.
  - `pbm_storage_type`: (String) Storage location for the contact:
    - `"0"`: Save to SIM card.
    - `"1"`: Save to Device memory.
- **Description:** Adds a new contact or updates an existing one. The frontend (`js/phonebook/phonebook.js`) collects data from a form, performs client-side validation (e.g., for name and number presence, valid number format), and then sends the request.
- **Example Response (JSON):** `{"result": "success"}`
- **Potential Errors:**
  - Storage full: If the selected `pbm_storage_type` (SIM or device) has reached its capacity. The UI should ideally check capacity (`pb_sim_capacity`, `pb_nv_capacity` vs. `sim_contact_used`, `nv_contact_used`) before allowing the save operation.
  - Invalid input: Backend validation might reject invalid phone numbers or excessively long names.
  - `{"result": "ERROR_PBM_REACH_MAX_RECORDS"}` or similar if storage is full.

#### 9.3. Delete Phonebook Contact(s)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=DELETE_PHONEBOOK`
  - `pbm_index`: (String) A semicolon-separated list of contact `id`s to be deleted (e.g., `"1;5;12;"`). The trailing semicolon is often present.
  - `pbm_storage_type`: (String) Specifies the storage from which to delete contacts.
    - `"0"`: Delete from SIM.
    - `"1"`: Delete from Device.
    - `"2"`: (Potentially) Delete from all stores if IDs are globally unique or if the backend logic handles iteration. This needs careful verification as IDs might only be unique within their respective stores. Usually, deletions are store-specific.
- **Description:** Deletes one or more contacts. The UI typically allows users to select contacts via checkboxes and then initiate a batch delete. A confirmation dialog is usually presented before the actual deletion.
- **Example Response (JSON):** `{"result": "success"}`

#### 9.4. Get Phonebook Capacity

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=pb_sim_capacity,pb_nv_capacity`
  - `multi_data=1`
- **Description:** Retrieves the maximum storage capacity for the SIM phonebook and the device (NVRAM) phonebook. This is often called alongside fetching contacts or before adding a new contact to inform the user or UI logic.
- **Example Response (JSON):**
  ```json
  {
    "pb_sim_capacity": "250", // Maximum number of contacts SIM can hold
    "pb_nv_capacity": "500" // Maximum number of contacts device memory can hold
  }
  ```
- **Integration:** This data is used in conjunction with `sim_contact_used` and `nv_contact_used` (from the `phonebook_data` response) to display available space (e.g., "SIM: 20/250 used").

---

### 10. Firmware Update (OTA/FOTA)

#### 10.1. Get Update Status & Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=new_version_state,current_upgrade_state,is_mandatory,dm_isautoupdate,dm_pollingcycle,dm_update_roam_permission,ota_version,ota_new_version,fota_version,fota_new_version,fota_pkg_size,fota_release_note_url`
  - `multi_data=1`
- **Example Response (JSON):**
  ```json
  {
    "new_version_state": "1", // 0=No new version, 1=New version available, 2=Downloading, 3=Downloaded, ready to install
    "current_upgrade_state": "0", // 0=Idle, 1=Checking, 2=Downloading, 3=Verifying, 4=Installing, 100=Success, >100=Error codes
    "is_mandatory": "0", // 0=Optional, 1=Mandatory update
    "dm_isautoupdate": "1", // Auto-check for updates: 0=off, 1=on
    "dm_pollingcycle": "20160", // Auto-check interval in minutes (e.g., 7 days)
    "dm_update_roam_permission": "0", // Allow update check/download on roaming: 0=off, 1=on
    "ota_version": "CurrentFirmwareV1",
    "ota_new_version": "NewFirmwareV2"
  }
  ```

#### 10.2. Set OTA Update Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_OTA_UPDATE_SETTINGS`
  - `dm_isautoupdate`: "0" or "1"
  - `dm_pollingcycle`: (String) Interval in minutes
  - `dm_update_roam_permission`: "0" or "1"
- **Example Response (JSON):** `{"result": "success"}`

#### 10.3. Trigger Update Check / Start Update

- **Check for Update:**
  - `goformId=CHECK_NEW_VERSION`
- **Start Download/Install (if new version available & downloaded):**
  - `goformId=START_UPGRADE`
  - `user_allow_upgrade`: "1" (User confirms upgrade)
- **Description:** Frontend polls `new_version_state` and `current_upgrade_state`.
- **Example Response (JSON):** `{"result": "success"}` (Indicates process started)

---

### 11. STK (SIM Application Toolkit)

#### 11.1. Get STK Status/Menu

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=stk_flag_info,stk_menu_info` (or similar, depends on implementation)
  - `multi_data=1`
- **Description:** Retrieves if STK service is available and the current STK menu/prompt.
- **Example Response (JSON):**
  ```json
  {
    "stk_flag_info": "1", // 0=Not available/Idle, 1=Menu/Prompt available
    "stk_menu_info": {
      // Structure varies greatly
      "type": "menu", // "menu", "text_display", "input_prompt"
      "title": "Operator Services",
      "items": [
        { "id": "1", "text": "Balance" },
        { "id": "2", "text": "Services" }
      ],
      "default_item_id": "1"
    }
  }
  ```

#### 11.2. Send STK Response/Selection

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_STK_RESPONSE`
  - `stk_select_id`: (String) ID of the selected menu item.
  - `stk_input_text`: (String) User input if STK prompt was for text.
  - `stk_confirm`: (String) "yes" or "no" for confirmation prompts.
- **Description:** Sends user's interaction back to the STK application.
- **Example Response (JSON):** `{"result": "success"}`

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
