# ZTE Web UI - REST API Documentation

This document outlines the structure and common commands for the REST API serving the ZTE Web UI. The frontend primarily communicates with the backend via `goform` CGI scripts.

## API Endpoint Structure

The Web UI uses two main endpoints for its operations:

1.  **GET Requests:** `/goform/goform_get_cmd_process`

    - Used for retrieving data and status information from the device.
    - Specific commands and parameters are passed as URL query parameters.
    - Example: `GET /goform/goform_get_cmd_process?cmd=Language&multi_data=1`

2.  **POST Requests:** `/goform/goform_set_cmd_process`
    - Used for sending commands to modify settings or perform actions on the device.
    - Commands and their values are typically sent as form data.
    - A `goformId` parameter usually specifies the action to be performed.
    - Example: `POST /goform/goform_set_cmd_process` with form data `goformId=SET_WEB_LANGUAGE&Language=en`

## Common Parameters

- `cmd`: (GET requests) Specifies the information or parameter(s) to retrieve. Multiple commands can be comma-separated.
- `multi_data=1`: (GET requests) Often used when requesting multiple pieces of data in a single `cmd`.
- `goformId`: (POST requests) Specifies the action or setting to be modified.
- `isTest=false`: This parameter appears in the `service.js` and is likely for internal testing/simulation; it would not typically be part of the live API interaction from an external client.
- `notCallback=true`: (POST requests, internal to `service.js`) Seems to control whether the frontend JavaScript handles the callback directly or if there's a subsequent status check.

## API Command Examples

The following are examples of commands and actions observed in the `service.js` file. The actual list of commands supported by the device firmware can be more extensive.

---

### 1. Wi-Fi Settings

#### 1.1. Get Basic Wi-Fi Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=m_ssid_enable,SSID1,AuthMode,HideSSID,WPAPSK1,MAX_Access_num,EncrypType,m_SSID,m_AuthMode,m_HideSSID,m_WPAPSK1,m_MAX_Access_num,m_EncrypType`
  - `multi_data=1`
- **Description:** Retrieves basic Wi-Fi settings for both primary (SSID1) and multi-SSID (m_SSID or SSID2). This includes SSID name, authentication mode, broadcast status, WPA preshared key, max access number, and encryption type.
- **Example Response (JSON):**
  ```json
  {
    "m_ssid_enable": "1", // Multi-SSID enabled status (0 or 1)
    "SSID1": "MyWiFi_SSID1",
    "AuthMode": "WPA2PSK", // e.g., OPEN, WPA2PSK, WPAPSKWPA2PSK
    "HideSSID": "0", // SSID broadcast (0=enabled, 1=disabled)
    "WPAPSK1": "mysecretpassword",
    "MAX_Access_num": "5",
    "EncrypType": "AES", // e.g., TKIP, AES, TKIPCCMP
    "m_SSID": "MyWiFi_SSID2",
    "m_AuthMode": "OPEN",
    "m_HideSSID": "0",
    "m_WPAPSK1": "",
    "m_MAX_Access_num": "3",
    "m_EncrypType": "NONE"
  }
  ```

#### 1.2. Set Basic Wi-Fi Settings (SSID1)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_SSID1_SETTINGS`
  - `ssid`: (String) SSID name
  - `broadcastSsidEnabled`: (String) "0" for broadcast enabled, "1" for disabled
  - `MAX_Access_num`: (String) Maximum number of connected stations
  - `security_mode`: (String) e.g., "OPEN", "WPA2PSK", "WPAPSKWPA2PSK"
  - `cipher`: (String) Encryption mode (e.g., "NONE", "AES", "TKIPCCMP"). Dependent on `security_mode`.
  - `passphrase`: (String) Wi-Fi password (if security mode is not OPEN)
- **Description:** Modifies the settings for the primary Wi-Fi SSID.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```
  or
  ```json
  { "result": "failure_reason_or_error_code" }
  ```

#### 1.3. Set Basic Wi-Fi Settings (SSID2 / Multi-SSID)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:** (Parameters are prefixed with `m_`)
  - `goformId=SET_WIFI_SSID2_SETTINGS`
  - `m_SSID`: (String) SSID name for the second SSID
  - `m_HideSSID`: (String) "0" for broadcast enabled, "1" for disabled
  - `m_MAX_Access_num`: (String) Maximum number of connected stations
  - `m_AuthMode`: (String) e.g., "OPEN", "WPA2PSK"
  - `m_EncrypType`: (String) Encryption mode (e.g., "NONE", "AES"). Dependent on `m_AuthMode`.
  - `m_WPAPSK1`: (String) Wi-Fi password for the second SSID (if security mode is not OPEN)
- **Description:** Modifies the settings for the secondary/multi-SSID.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 1.4. Set Multi-SSID Switch

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_INFO`
  - `m_ssid_enable`: (String) "0" to disable multi-SSID, "1" to enable
- **Description:** Enables or disables the multi-SSID functionality.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 1.5. Get Advanced Wi-Fi Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=WirelessMode,CountryCode,Channel,HT_MCS,wifi_band,wifi_11n_cap`
  - `multi_data=1`
- **Description:** Retrieves advanced Wi-Fi settings.
- **Example Response (JSON):**
  ```json
  {
    "WirelessMode": "4", // e.g., 0 (802.11b), 1 (802.11g), 2 (802.11n only), 4 (802.11b/g/n)
    "CountryCode": "CN",
    "Channel": "0", // 0 for Auto, or specific channel number
    "HT_MCS": "1", // Rate
    "wifi_band": "b", // 'a' for 5GHz, 'b' for 2.4GHz
    "wifi_11n_cap": "0" // Bandwidth: 0 for 20MHz, 1 for 20/40MHz
  }
  ```

#### 1.6. Set Advanced Wi-Fi Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_INFO`
  - `wifiMode`: (String) Wireless mode (e.g., "4")
  - `countryCode`: (String) Country code (e.g., "CN")
  - `wifi_band`: (String) Wi-Fi band ('a' or 'b') - if supported
  - `selectedChannel`: (String) Channel number or "auto"
  - `abg_rate`: (String) Rate (if applicable for the mode)
  - `wifi_11n_cap`: (String) Bandwidth ('0' or '1') - if supported
- **Description:** Modifies advanced Wi-Fi settings.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 1.7. Get WPS (Wi-Fi Protected Setup) Info

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=WscModeOption,AuthMode,RadioOff,EncrypType,wps_mode,WPS_SSID,m_ssid_enable,SSID1,m_SSID,m_EncrypType`
  - `multi_data=1`
- **Description:** Retrieves WPS status and related Wi-Fi information.
- **Example Response (JSON):**
  ```json
  {
    "WscModeOption": "0", // WPS Flag (0=off, 1=on/active)
    "AuthMode": "WPA2PSK",
    "RadioOff": "1", // Wi-Fi radio status (1=on, 0=off)
    "EncrypType": "AES",
    "wps_mode": "PIN", // Current WPS mode (e.g., PIN, PBC)
    "WPS_SSID": "MyWiFi_SSID1",
    "m_ssid_enable": "0",
    "SSID1": "MyWiFi_SSID1",
    "m_SSID": "MyWiFi_SSID2",
    "m_EncrypType": "NONE"
  }
  ```

#### 1.8. Start WPS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=WIFI_WPS_SET`
  - `WPS_SSID`: (String) The SSID to use for WPS
  - `wps_mode`: (String) "PIN" or "PBC"
  - `wps_pin`: (String) The PIN code if `wps_mode` is "PIN"
- **Description:** Initiates the WPS process.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 1.9. Get Wi-Fi Sleep Mode Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sysIdleTimeToSleep`
- **Description:** Retrieves the Wi-Fi sleep mode timeout.
- **Example Response (JSON):**
  ```json
  { "sysIdleTimeToSleep": "10" }
   // Time in minutes, -1 for Never Sleep
  ```

#### 1.10. Set Wi-Fi Sleep Mode Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_WIFI_SLEEP_INFO`
  - `sysIdleTimeToSleep`: (String) Sleep timeout in minutes (e.g., "5", "10", "-1" for never)
- **Description:** Sets the Wi-Fi sleep mode timeout.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

---

### 2. Network Settings

#### 2.1. Get Network Selection Info

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=current_network_mode,m_netselect_save,net_select_mode,m_netselect_contents,net_select,ppp_status,modem_main_state,lte_band_lock,wcdma_band_lock`
  - `multi_data=1`
- **Description:** Retrieves current network mode, selection mode (auto/manual), available networks (if scanned), current registered network, PPP status, modem state, and band lock information.
- **Example Response (JSON):**
  ```json
  {
    "current_network_mode": "LTE",
    "m_netselect_save": "NETWORK_auto", // Saved preference
    "net_select_mode": "0", // Network selection mode (0=auto, 1=manual)
    "m_netselect_contents": "2,ProviderA,46000,7;1,ProviderB,46001,2", // Format: state,ShortName,Numeric,Rat;...
    "net_select": "NETWORK_auto", // Current network selection preference
    "ppp_status": "ppp_connected",
    "modem_main_state": "modem_init_complete",
    "lte_band_lock": "all",
    "wcdma_band_lock": "all"
  }
  ```

#### 2.2. Set Network Bearer Preference (Network Mode)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_BEARER_PREFERENCE`
  - `BearerPreference`: (String) e.g., "NETWORK_auto", "Only_LTE", "Only_WCDMA"
  - `lte_band_lock`: (String) e.g., "all", "2600M"
  - `wcdma_band_lock`: (String) e.g., "all", "2100M"
- **Description:** Sets the preferred network mode and band locks.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 2.3. Scan for Networks

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SCAN_NETWORK`
- **Description:** Initiates a scan for available mobile networks. The result is not returned directly; a subsequent GET request to `m_netselect_contents` (see 2.1) is needed after checking `m_netselect_status`.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
   // Indicates scan started
  ```

#### 2.4. Set Network (Manual Registration)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_NETWORK`
  - `NetworkNumber`: (String) MCCMNC of the network to register to (e.g., "46000")
  - `Rat`: (String) Radio Access Technology (e.g., "0" for 2G, "2" for 3G, "7" for 4G/LTE)
- **Description:** Attempts to manually register to the specified network. Success/failure needs to be polled via `m_netselect_result`.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
   // Indicates registration attempt started
  ```

#### 2.5. Get APN Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=APN_config0,...,APN_config19,ipv6_APN_config0,...,ipv6_APN_config19,m_profile_name,profile_name,wan_dial,apn_select,pdp_type,pdp_select,pdp_addr,index,Current_index,apn_auto_config,ipv6_apn_auto_config,apn_mode,wan_apn,ppp_auth_mode,ppp_username,ppp_passwd,dns_mode,prefer_dns_manual,standby_dns_manual,ipv6_wan_apn,ipv6_pdp_type,ipv6_ppp_auth_mode,ipv6_ppp_username,ipv6_ppp_passwd,ipv6_dns_mode,ipv6_prefer_dns_manual,ipv6_standby_dns_manual`
  - `multi_data=1`
- **Description:** Retrieves a comprehensive list of APN profiles and current APN settings for both IPv4 and IPv6.
- **Example Response (JSON Snippet):**
  ```json
  {
    "APN_config0": "Profile1($)internet($)manual($)*99#($)pap($)user($)pass($)IP($)auto($)($)auto($)($)",
    "m_profile_name": "Profile1",
    "apn_mode": "manual", // "auto" or "manual"
    "wan_apn": "internet",
    "ppp_auth_mode": "pap", // "none", "pap", "chap"
    "ppp_username": "user",
    "ppp_passwd": "password",
    "dns_mode": "auto", // "auto" or "manual"
    "prefer_dns_manual": "8.8.8.8",
    "standby_dns_manual": "8.8.4.4",
    "pdp_type": "IP" // "IP", "IPv6", "IPv4v6"
    // ... and many more fields including ipv6 settings
  }
  ```
  _Note: APN profile strings are typically delimited by `($)`._

#### 2.6. Add/Edit APN Profile

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Example for IPv4):**
  - `goformId=APN_PROC_EX` (or `APN_PROC` for older interfaces)
  - `apn_action`: "save" (for new) or "set_default" with `set_default_flag=0` (for edit and set as default)
  - `apn_mode`: "manual"
  - `profile_name`: (String)
  - `wan_dial`: (String) e.g., "\*99#"
  - `apn_select`: "manual"
  - `pdp_type`: (String) "IP", "IPv6", or "IPv4v6"
  - `index`: (String) Index of the profile to edit, or next available for new.
  - `wan_apn`: (String) APN name
  - `ppp_auth_mode`: (String) "none", "pap", "chap"
  - `ppp_username`: (String)
  - `ppp_passwd`: (String)
  - `dns_mode`: (String) "auto" or "manual"
  - `prefer_dns_manual`: (String) Primary DNS (if dns_mode is manual)
  - `standby_dns_manual`: (String) Secondary DNS (if dns_mode is manual)
  - _(Similar parameters exist for IPv6, prefixed with `ipv6_`)_
- **Description:** Adds a new APN profile or edits an existing one.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 2.7. Delete APN Profile

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=APN_PROC_EX` (or `APN_PROC`)
  - `apn_action`: "delete"
  - `apn_mode`: "manual"
  - `index`: (String) Index of the profile to delete.
- **Description:** Deletes an APN profile.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

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
- **Description:** Sets a specified APN profile as the default.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 2.9. Set Connection Mode (Auto/Manual Dial)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_CONNECTION_MODE`
  - `ConnectionMode`: (String) "auto_dial" or "manual_dial"
  - `roam_setting_option`: (String) "on" or "off" (for allow roaming)
- **Description:** Sets the WAN connection mode (automatic or manual) and roaming preference.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

---

### 3. SMS (Short Message Service)

#### 3.1. Get SMS Messages

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sms_data_total`
  - `page`: (String) Page number (e.g., "0")
  - `data_per_page`: (String) Number of messages per page (e.g., "500")
  - `mem_store`: (String) Message store type (e.g., "1" for device, "0" for SIM)
  - `tags`: (String) Message tags/status to retrieve (e.g., "10" for all, "0" for read, "1" for unread, "2" for sent, "3" for failed, "4" for draft)
  - `order_by`: (String) e.g., "order by id desc"
- **Description:** Retrieves a list of SMS messages.
- **Example Response (JSON):**
  ```json
  {
    "messages": [
      {
        "id": "60",
        "number": "+1234567890",
        "tag": "0", // 0=read, 1=unread, 2=sent, 3=failed, 4=draft
        "content": "48656C6C6F20576F726C64", // Hex-encoded message content
        "date": "13,08,07,10,30,15", // YY,MM,DD,HH,MM,SS
        "draft_group_id": ""
      }
      // ... more messages
    ]
  }
  ```

#### 3.2. Send SMS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SEND_SMS`
  - `Number`: (String) Recipient phone number(s), semicolon-separated for multiple.
  - `sms_time`: (String) Current time string (format: `YY;MM;DD;HH;MM;SS;TZ`)
  - `MessageBody`: (String) Hex-encoded message content.
  - `ID`: (String) Message ID (usually -1 for new message).
  - `encode_type`: (String) "GSM7_default" or "UNICODE".
- **Description:** Sends an SMS message. Success/failure is typically polled via `sms_cmd_status_info`.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
   // Indicates send attempt started
  ```

#### 3.3. Save SMS Draft

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SAVE_SMS`
  - `SMSMessage`: (String) Hex-encoded message content.
  - `SMSNumber`: (String) Recipient phone number(s), semicolon-separated.
  - `Index`: (String) -1 for new draft, or existing draft ID to overwrite.
  - `encode_type`: (String)
  - `sms_time`: (String) Current time string.
  - `draft_group_id`: (String) Group ID for multi-recipient drafts.
- **Description:** Saves an SMS message as a draft.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 3.4. Delete SMS

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=DELETE_SMS`
  - `msg_id`: (String) Semicolon-separated list of message IDs to delete (e.g., "60;61;").
- **Description:** Deletes specified SMS messages.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 3.5. Set SMS as Read

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_MSG_READ`
  - `msg_id`: (String) Semicolon-separated list of message IDs to mark as read.
  - `tag`: "0" (to mark as read)
- **Description:** Marks specified SMS messages as read.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 3.6. Get SMS Settings (Center Number, Validity, etc.)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sms_parameter_info`
- **Description:** Retrieves SMS service center number, validity period, and delivery report settings.
- **Example Response (JSON):**
  ```json
  {
    "sms_para_sca": "+12345678900", // SMS Center Number
    "sms_para_mem_store": "native", // Preferred storage (e.g., native, sim)
    "sms_para_status_report": "0", // Delivery report (0=off, 1=on)
    "sms_para_validity_period": "255" // e.g., 143 (12h), 167 (1d), 173 (1w), 255 (max)
  }
  ```

#### 3.7. Set SMS Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=SET_MESSAGE_CENTER`
  - `save_time`: (String) Validity period value (e.g., "255")
  - `MessageCenter`: (String) SMSC number
  - `status_save`: (String) Delivery report ("0" or "1")
  - `save_location`: (String) "native" (usually)
- **Description:** Sets SMS service center, validity, and report settings.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

---

### 4. Device Status & Information

#### 4.1. Get General Status Information

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters (Partial list, many commands can be combined):**
  - `cmd=modem_main_state,pin_status,loginfo,new_version_state,current_upgrade_state,is_mandatory,sms_received_flag,sts_received_flag,signalbar,network_type,network_provider,ppp_status,EX_SSID1,ex_wifi_status,EX_wifi_profile,m_ssid_enable,sms_unread_num,RadioOff,simcard_roam,lan_ipaddr,station_mac,battery_charging,battery_vol_percent,battery_pers,spn_display_flag,plmn_display_flag,spn_name_data,spn_b1_flag,spn_b2_flag,realtime_tx_bytes,realtime_rx_bytes,realtime_time,realtime_tx_thrpt,realtime_rx_thrpt,monthly_rx_bytes,monthly_tx_bytes,monthly_time,date_month,data_volume_limit_switch,data_volume_limit_size,data_volume_alert_percent,data_volume_limit_unit,roam_setting_option,upg_roam_switch,hplmn`
  - `multi_data=1`
- **Description:** This is a frequently polled endpoint to get a wide range of status information including SIM status, network signal, connection status, Wi-Fi status, battery level, SMS notifications, data usage, etc.
- **Example Response (JSON Snippet):**
  ```json
  {
    "modem_main_state": "modem_init_complete",
    "pin_status": "0", // PIN status (e.g., 0=disabled/verified, 1=required)
    "loginfo": "ok", // Login status ("ok" or "no")
    "signalbar": "4", // Signal strength (0-5)
    "network_type": "LTE",
    "network_provider": "My Operator",
    "ppp_status": "ppp_connected",
    "sms_unread_num": "3",
    "RadioOff": "1", // Wi-Fi radio status (1=on, 0=off)
    "simcard_roam": "mInternal", // Roaming status
    "battery_charging": "0", // 0=not charging, 1=charging
    "battery_pers": "4" // Battery level indicator (e.g., 0-4 or percentage string)
    // ... many other fields
  }
  ```

#### 4.2. Get Device Information

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=wifi_coverage,m_ssid_enable,imei,web_version,wa_inner_version,hardware_version,MAX_Access_num,SSID1,m_SSID,m_HideSSID,m_MAX_Access_num,lan_ipaddr,wan_active_band,mac_address,msisdn,LocalDomain,wan_ipaddr,ipv6_wan_ipaddr,ipv6_pdp_type,pdp_type,ppp_status,sim_iccid,sim_imsi,rmcc,rmnc,rssi,rscp,lte_rsrp,ecio,lte_snr,network_type,lte_rssi,lac_code,cell_id,lte_pci,dns_mode,prefer_dns_manual,standby_dns_manual,prefer_dns_auto,standby_dns_auto,ipv6_dns_mode,ipv6_prefer_dns_manual,ipv6_standby_dns_manual,ipv6_prefer_dns_auto,ipv6_standby_dns_auto,model_name`
  - `multi_data=1`
- **Description:** Retrieves detailed device hardware, software, and network interface information.
- **Example Response (JSON Snippet):**
  ```json
  {
    "imei": "123456789012345",
    "web_version": "WEB_BLERUSMF90V1.0.0B03",
    "wa_inner_version": "FW_VERSION_XYZ",
    "hardware_version": "HW_V1.0",
    "lan_ipaddr": "192.168.0.1",
    "mac_address": "00:11:22:AA:BB:CC",
    "msisdn": "+19876543210", // Phone number if available
    "sim_iccid": "8901234567890123456F",
    "model_name": "MF823"
    // ... and many other fields
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
      { "mac_addr": "00:23:CD:AC:08:7E", "hostname": "MyLaptop" },
      { "mac_addr": "34:E0:CF:E0:B2:99", "hostname": "android-device" }
    ]
  }
  ```

---

### 5. System Administration

#### 5.1. Login

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=LOGIN`
  - `password`: (String) Administrator password
- **Description:** Authenticates the user.
- **Example Response (JSON):**
  ```json
  { "result": "0" }
   // 0 for success, other values for failure (e.g., 3 for bad password)
  ```

#### 5.2. Logout

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=LOGOUT`
- **Description:** Logs out the current user.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 5.3. Change Admin Password

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=CHANGE_PASSWORD`
  - `oldPassword`: (String) Current administrator password
  - `newPassword`: (String) New administrator password
- **Description:** Changes the administrator password.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 5.4. Get PIN Status/Attempts

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=pinnumber,pin_status,puknumber`
  - `multi_data=1`
- **Description:** Retrieves PIN attempts remaining, PIN status, and PUK attempts remaining.
- **Example Response (JSON):**
  ```json
  {
    "pinnumber": "3", // PIN attempts left
    "pin_status": "0", // 0=Disabled/OK, 1=PIN Required, 2=PUK Required, 3=SIM Card Error
    "puknumber": "10" // PUK attempts left
  }
  ```

#### 5.5. Enter PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=ENTER_PIN`
  - `PinNumber`: (String) The PIN code.
- **Description:** Submits a PIN code to unlock the SIM card.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 5.6. Enter PUK and Set New PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=ENTER_PUK`
  - `PUKNumber`: (String) The PUK code.
  - `PinNumber`: (String) The new PIN code to set.
- **Description:** Submits a PUK code and sets a new PIN.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 5.7. Enable/Disable/Change PIN

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Enable PIN):**
  - `goformId=ENABLE_PIN`
  - `OldPinNumber`: (String) Current PIN
- **Form Data (Disable PIN):**
  - `goformId=DISABLE_PIN`
  - `OldPinNumber`: (String) Current PIN
- **Form Data (Change PIN):**
  - `goformId=ENABLE_PIN` (Note: Some devices might use a different goformId like `CHANGE_PIN`)
  - `OldPinNumber`: (String) Current PIN
  - `NewPinNumber`: (String) New PIN
- **Description:** Manages PIN lock settings.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 5.8. Get LAN Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=lan_ipaddr,lan_netmask,mac_address,dhcpEnabled,dhcpStart,dhcpEnd,dhcpLease_hour`
  - `multi_data=1`
- **Description:** Retrieves LAN IP address, subnet mask, MAC address, and DHCP server settings.
- **Example Response (JSON):**
  ```json
  {
    "lan_ipaddr": "192.168.0.1",
    "lan_netmask": "255.255.255.0",
    "mac_address": "AA:BB:CC:11:22:33",
    "dhcpEnabled": "1", // 1=enabled, 0=disabled
    "dhcpStart": "192.168.0.100",
    "dhcpEnd": "192.168.0.200",
    "dhcpLease_hour": "24"
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
- **Description:** Configures LAN IP and DHCP server settings.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 5.10. Restore Factory Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=RESTORE_FACTORY_SETTINGS`
- **Description:** Resets the device to its factory default settings. The device will restart.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
   // Indicates process started
  ```
  _(Frontend usually polls `restore_flag` to check completion)_

#### 5.11. Restart Device

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=REBOOT_DEVICE`
- **Description:** Restarts the device.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
   // Indicates process started
  ```

---

### 6. USSD (Unstructured Supplementary Service Data)

#### 6.1. Send USSD Command / Reply to USSD

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data (Send):**
  - `goformId=USSD_PROCESS`
  - `USSD_operator`: "ussd_send"
  - `USSD_send_number`: (String) The USSD code (e.g., "\*100#")
- **Form Data (Reply):**
  - `goformId=USSD_PROCESS`
  - `USSD_operator`: "ussd_reply"
  - `USSD_reply_number`: (String) The reply to the USSD prompt.
- **Description:** Sends a USSD command or a reply to an interactive USSD session. The response is typically polled via `ussd_write_flag` and `ussd_data_info`.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
   // Indicates command/reply sent
  ```

#### 6.2. Cancel USSD Session

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=USSD_PROCESS`
  - `USSD_operator`: "ussd_cancel"
- **Description:** Cancels the current USSD session.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 6.3. Get USSD Data Info (After Sending/Replying)

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=ussd_data_info`
- **Description:** Retrieves the content of the USSD response from the network.
- **Example Response (JSON):**
  ```json
  {
    "ussd_data": "WW91ciBiYWxhbmNlIGlzICQxMC4wMA==", // Base64 encoded USSD message
    "ussd_action": "0" // Action code from network (e.g., 0=display, 1=request input)
  }
  ```

---

### 7. SD Card & DLNA

#### 7.1. Get SD Card Configuration

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=sdcard_mode_option,sd_card_state,HTTP_SHARE_STATUS,HTTP_SHARE_CARD_USER,HTTP_SHARE_WR_AUTH,HTTP_SHARE_FILE`
  - `multi_data=1`
- **Description:** Retrieves SD card mode (USB/HTTP Share), status, and HTTP sharing settings.
- **Example Response (JSON):**
  ```json
  {
    "sdcard_mode_option": "1", // 0=HTTP Share, 1=USB Mode
    "sd_card_state": "1", // 0=No SD, 1=Ready, 2=Invalid
    "HTTP_SHARE_STATUS": "Enabled", // "Enabled" or "Disabled"
    "HTTP_SHARE_CARD_USER": "user", // Username for HTTP share (if applicable)
    "HTTP_SHARE_WR_AUTH": "readWrite", // "readOnly" or "readWrite"
    "HTTP_SHARE_FILE": "/mmc2" // Path being shared (e.g., /mmc2 for whole card)
  }
  ```

#### 7.2. Set SD Card Mode (USB / HTTP Share)

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=HTTPSHARE_MODE_SET`
  - `mode_set`: (String) "http_share_mode" or "usb_mode"
- **Description:** Sets the SD card access mode.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 7.3. Set SD Card HTTP Sharing Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=HTTPSHARE_AUTH_SET`
  - `HTTP_SHARE_STATUS`: (String) "Enabled" or "Disabled"
  - `HTTP_SHARE_WR_AUTH`: (String) "readOnly" or "readWrite"
  - `HTTP_SHARE_FILE`: (String) Path to share (e.g., "/mmc2/photos")
- **Description:** Configures HTTP sharing options for the SD card.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

#### 7.4. Get DLNA Settings

- **Endpoint:** `/goform/goform_get_cmd_process`
- **Method:** GET
- **Parameters:**
  - `cmd=dlna_language,dlna_name,dlna_share_audio,dlna_share_video,dlna_share_image,dlna_scan_state,sd_card_state,sdcard_mode_option`
  - `multi_data=1`
- **Description:** Retrieves DLNA server settings.
- **Example Response (JSON):**
  ```json
  {
    "dlna_language": "english",
    "dlna_name": "MyDLNAServer",
    "dlna_share_audio": "on",
    "dlna_share_video": "on",
    "dlna_share_image": "on",
    "dlna_scan_state": "0", // 0=idle, 1=scanning
    "sd_card_state": "1",
    "sdcard_mode_option": "0" // DLNA usually requires HTTP Share mode
  }
  ```

#### 7.5. Set DLNA Settings

- **Endpoint:** `/goform/goform_set_cmd_process`
- **Method:** POST
- **Form Data:**
  - `goformId=DLNA_SETTINGS`
  - `dlna_language`: (String)
  - `dlna_name`: (String) DLNA server name
  - `dlna_share_audio`: (String) "on" or "off"
  - `dlna_share_video`: (String) "on" or "off"
  - `dlna_share_image`: (String) "on" or "off"
- **Description:** Configures DLNA server settings.
- **Example Response (JSON):**
  ```json
  { "result": "success" }
  ```

---

### Note:

This documentation is based on the provided `service.js` and may not cover all API functionalities of the device. The exact behavior and availability of commands can vary between firmware versions and device models.
