// data/mockData.js

// Helper function to get a random integer
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to encode a UTF-8 string to a UCS-2 hex string
// This mimics the addon's `encodeMessage` for consistency.
export function stringToUcs2Hex(textString) {
  var haut = 0;
  var result = '';
  if (typeof textString !== 'string') textString = String(textString);
  for (var i = 0; i < textString.length; i++) {
    var b = textString.charCodeAt(i);
    if (haut != 0) {
      if (0xdc00 <= b && b <= 0xdfff) {
        let val = 0x10000 + ((haut - 0xd800) << 10) + (b - 0xdc00);
        let cp = (val + 0).toString(16).toUpperCase();
        result += cp;
        haut = 0;
        continue;
      } else {
        let cp = (haut + 0).toString(16).toUpperCase();
        while (cp.length < 4) {
          cp = '0' + cp;
        }
        result += cp;
        haut = 0;
      }
    }
    if (0xd800 <= b && b <= 0xdbff) {
      haut = b;
      if (i === textString.length - 1) {
        let cp = (b + 0).toString(16).toUpperCase();
        while (cp.length < 4) {
          cp = '0' + cp;
        }
        result += cp;
      }
    } else {
      let cp = (b + 0).toString(16).toUpperCase();
      while (cp.length < 4) {
        cp = '0' + cp;
      }
      result += cp;
    }
  }
  return result;
}

const mockState = {
  modem_main_state: 'modem_init_complete',
  pin_status: '0',
  loginfo: 'ok',
  admin_Password: 'admin',
  puknumber: 10,
  pinnumber: 3,
  language: 'en',
  ppp_status: 'ppp_disconnected',
  signalbar: getRandomInt(1, 5).toString(),
  network_type: ['LTE', 'WCDMA', 'GSM', 'HSPA+'][getRandomInt(0, 3)],
  network_provider: [
    'Digitel',
    'Vodafone',
    'Orange',
    'Telefonica',
    'ZTE_TEST_NET',
  ][getRandomInt(0, 4)],
  simcard_roam: '0',
  lan_ipaddr: '192.168.0.1',
  new_version_state: '0',
  current_upgrade_state: '',
  is_mandatory: '0',
  sms_received_flag: '1',
  sts_received_flag: '0',
  sms_unread_num: '2',
  sms_cmd_status_info: { sms_cmd: 0, sms_cmd_status_result: '0' },
  sms_capacity_info: {
    sms_nv_total: '200',
    sms_nv_rev_total: '8',
    sms_nv_send_total: '3',
    sms_nv_draftbox_total: '1',
    sms_sim_total: '50',
    sms_sim_rev_total: '2',
    sms_sim_send_total: '1',
    sms_sim_draftbox_total: '0',
  },
  sms_parameter_info: {
    sms_para_sca: '+584128000000',
    sms_para_mem_store: 'nv',
    sms_para_status_report: '1',
    sms_para_validity_period: '255',
  },
  sms_messages: [
    {
      id: '1',
      number: '+11234567890',
      content: stringToUcs2Hex('Hello world! This is an older read message.'),
      date: '23,01,01,10,30,00',
      tag: '0',
      draft_group_id: '',
      encode_type: 'UCS2',
    },
    {
      id: '2',
      number: '+584124773988',
      content: stringToUcs2Hex("Hi! What's up?"),
      date: '23,01,25,14,35,51',
      tag: '2',
      draft_group_id: '1',
      encode_type: 'UCS2',
    },
    {
      id: '3',
      number: 'Equipo Digitel',
      content: stringToUcs2Hex('Bienvenido a Digitel. Su saldo es Bs. 50.00.'),
      date: '23,01,26,09,15,00',
      tag: '1',
      draft_group_id: '',
      encode_type: 'UCS2',
    },
    {
      id: '4',
      number: '+19876543210',
      content: stringToUcs2Hex('Meeting at 3 PM today?'),
      date: '23,01,26,11,00,00',
      tag: '1',
      draft_group_id: '',
      encode_type: 'UCS2',
    },
    {
      id: '5',
      number: 'Genesis D.',
      content: stringToUcs2Hex('Can you call me back?'),
      date: '23,01,25,18,20,10',
      tag: '0',
      draft_group_id: '',
      encode_type: 'UCS2',
    },
    {
      id: '6',
      number: '+584120000001',
      content: stringToUcs2Hex(
        'Your delivery report: Message to +584124773988 successfully delivered.'
      ),
      date: '23,01,25,14,38,15',
      tag: '5',
      draft_group_id: '1',
      encode_type: 'UCS2',
    },
  ],
  sms_id_counter: 6,
  m_ssid_enable: '0',
  SSID1: 'ZTE_Router_P18X',
  AuthMode: 'WPA2PSK',
  HideSSID: '0',
  WPAPSK1: 'defaultPassword123',
  MAX_Access_num: '10',
  EncrypType: 'AES',
  m_SSID: 'ZTE_Router_Guest',
  m_AuthMode: 'OPEN',
  m_HideSSID: '0',
  m_WPAPSK1: '',
  m_MAX_Access_num: '5',
  m_EncrypType: 'NONE',
  RadioOff: '0',
  station_list: [
    { mac_addr: '00:1A:2B:3C:4D:5E', hostname: 'MyLaptop-ZTE' },
    { mac_addr: 'F0:E1:D2:C3:B4:A5', hostname: 'Alex-Phone' },
  ],
  pbm_init_flag: '0',
  pbm_write_flag: '0',
  phonebook_entries: [
    // Store names/emails as UCS-2 HEX
    {
      pbm_id: '1',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Alexander Salas'),
      pbm_number: '+584124773988',
      pbm_anr: '+584161234567',
      pbm_anr1: '',
      pbm_group: 'Common',
      pbm_email: stringToUcs2Hex('alex.salas@example.com'),
    },
    {
      pbm_id: '2',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Equipo Digitel'),
      pbm_number: '411',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Common',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '3',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Genesis D.'),
      pbm_number: '+584249876543',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Colleague',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '4',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Jesus Zuleta'),
      pbm_number: '+584141112233',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Colleague',
      pbm_email: stringToUcs2Hex('j.zuleta@work.com'),
    },
    {
      pbm_id: '5',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Pedro Molina'),
      pbm_number: '+584125556677',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Colleague',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '6',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Roberth Hidalgo'),
      pbm_number: '+584268889900',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Colleague',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '7',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Alex Salas'),
      pbm_number: '+584123216547',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Family',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '8',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Fatma Youssef'),
      pbm_number: '+201001234567',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Family',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '9',
      pbm_location: '0',
      pbm_name: stringToUcs2Hex('Atencion Cliente'),
      pbm_number: '121',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'SIM Contacts',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '10',
      pbm_location: '0',
      pbm_name: stringToUcs2Hex('Buzon de voz412'),
      pbm_number: '*123',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'SIM Contacts',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '11',
      pbm_location: '0',
      pbm_name: stringToUcs2Hex('Club Digitel'),
      pbm_number: '700',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'SIM Contacts',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '12',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Belkys Merchan'),
      pbm_number: '+584127654321',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Common',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '13',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Curso'),
      pbm_number: '+584121122334',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Common',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '14',
      pbm_location: '0',
      pbm_name: stringToUcs2Hex('Hicham'),
      pbm_number: '+33612345678',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'SIM Contacts',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '15',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Ramon CANTV'),
      pbm_number: '155',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Common',
      pbm_email: stringToUcs2Hex(''),
    },
    {
      pbm_id: '16',
      pbm_location: '1',
      pbm_name: stringToUcs2Hex('Uclides Gil'),
      pbm_number: '+584129988776',
      pbm_anr: '',
      pbm_anr1: '',
      pbm_group: 'Common',
      pbm_email: stringToUcs2Hex(''),
    },
  ],
  pbm_id_counter: 16,
  pbm_capacity_info: {
    pbm_dev_max_record_num: '250',
    pbm_dev_used_record_num: '12',
    pbm_sim_max_record_num: '100',
    pbm_sim_used_record_num: '4',
    pbm_sim_type: '3G',
    pbm_sim_max_name_len: '24',
    pbm_sim_max_number_len: '40',
  },
  APN_config0:
    'Digitel Internet($)internet.digitel.ve($)manual($)*99#($)none($)($)($)IP($)auto($)($)auto($)($)',
  APN_config1:
    'Movistar Internet($)internet.movistar.ve($)manual($)*99#($)none($)($)($)IP($)auto($)($)auto($)($)',
  ipv6_APN_config0:
    'Digitel IPv6($)ipv6.digitel.ve($)manual($)*99#($)none($)($)($)IPv6($)auto($)($)auto($)($)',
  apn_mode: 'manual',
  m_profile_name: 'Digitel Internet',
  Current_index: '0',
  wan_apn: 'internet.digitel.ve',
  ppp_auth_mode: 'none',
  ppp_username: '',
  ppp_passwd: '',
  dns_mode: 'auto',
  prefer_dns_manual: '',
  standby_dns_manual: '',
  ussd_write_flag: '0',
  ussd_data_info: { ussd_data: '', ussd_action: '0' },
  version_info: {
    software_version: 'WEB_BLERUSMF90V1.0.0B03',
    inner_software_version: 'P18X_V1.0.1',
  },
  HardwareVersion: 'P18XMB_A',
  realtime_rx_bytes: '10240',
  realtime_tx_bytes: '5120',
  realtime_time: '300',
  realtime_rx_thrpt: '81920',
  realtime_tx_thrpt: '40960',
  monthly_rx_bytes: '10485760',
  monthly_tx_bytes: '5242880',
  monthly_time: '36000',
  date_month: (new Date().getMonth() + 1).toString(),
  data_volume_limit_switch: '0',
  data_volume_limit_size: '10240_1',
  data_volume_alert_percent: '80',
  data_volume_limit_unit: 'data',
  dynamicDataIntervalId: null,
};

function updateDynamicData() {
  mockState.signalbar = getRandomInt(0, 5).toString();
  if (mockState.ppp_status === 'ppp_connected') {
    mockState.realtime_rx_bytes = (
      parseInt(mockState.realtime_rx_bytes) + getRandomInt(1000, 50000)
    ).toString();
    mockState.realtime_tx_bytes = (
      parseInt(mockState.realtime_tx_bytes) + getRandomInt(500, 20000)
    ).toString();
    mockState.realtime_rx_thrpt = getRandomInt(10000, 1500000).toString();
    mockState.realtime_tx_thrpt = getRandomInt(5000, 800000).toString();
    mockState.realtime_time = (
      parseInt(mockState.realtime_time) + 1
    ).toString();
  }
  if (
    mockState.phonebook_entries &&
    mockState.phonebook_entries.length > 0 &&
    Math.random() < 0.01 &&
    mockState.sms_messages.length <
      parseInt(mockState.sms_capacity_info.sms_nv_total) - 5
  ) {
    const newId = (mockState.sms_id_counter + 1).toString();
    const senderIndex = getRandomInt(0, mockState.phonebook_entries.length - 1);
    const sender = mockState.phonebook_entries[senderIndex];
    const readableContent = `This is a new random SMS! #${newId}`;
    const newSms = {
      id: newId,
      number: sender.pbm_number,
      content: stringToUcs2Hex(readableContent),
      date:
        new Date()
          .toLocaleDateString('en-CA', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          })
          .replace(/-/g, ',') +
        ',' +
        new Date().toLocaleTimeString('en-GB').replace(/:/g, ','),
      tag: '1',
      draft_group_id: '',
      encode_type: 'UCS2',
    };
    mockState.sms_messages.push(newSms);
    mockState.sms_id_counter = parseInt(newId);
    mockState.sms_unread_num = (
      parseInt(mockState.sms_unread_num) + 1
    ).toString();
    mockState.sms_received_flag = '1';
    mockState.sms_capacity_info.sms_nv_rev_total = (
      parseInt(mockState.sms_capacity_info.sms_nv_rev_total) + 1
    ).toString();
    console.log(
      'Simulated new SMS received (content UCS-2 Hex encoded):',
      newSms.content
    );
  }
}

export function startDynamicDataUpdates() {
  if (mockState.dynamicDataIntervalId === null) {
    mockState.dynamicDataIntervalId = setInterval(updateDynamicData, 2000);
    console.log('Dynamic data updates started.');
  }
}

export function stopDynamicDataUpdates() {
  if (mockState.dynamicDataIntervalId !== null) {
    clearInterval(mockState.dynamicDataIntervalId);
    mockState.dynamicDataIntervalId = null;
    console.log('Dynamic data updates stopped.');
  }
}

startDynamicDataUpdates();

export const getState = (key) => mockState[key];

export const getAllStates = (keys) => {
  const result = {};
  keys.forEach((key) => {
    if (
      Object.prototype.hasOwnProperty.call(mockState, key) &&
      key !== 'dynamicDataIntervalId'
    ) {
      result[key] = mockState[key];
    }
  });
  return result;
};

export const setState = (key, value) => {
  mockState[key] = value;
  console.log(`Set mockState[${key}] = ${JSON.stringify(value)}`);
  return true;
};

export const addSms = (smsData) => {
  mockState.sms_id_counter += 1;

  let finalContentForStorage = smsData.MessageBody;
  if (
    smsData.encode_type &&
    (smsData.encode_type.toLowerCase().includes('gsm7') ||
      smsData.encode_type.toLowerCase().includes('ucs2'))
  ) {
    console.log(
      `Received MessageBody (assumed UCS-2 Hex from addon): "${smsData.MessageBody}"`
    );
    finalContentForStorage = smsData.MessageBody;
  } else {
    console.warn(
      `MessageBody received as non-hex or with unexpected encode_type: "${smsData.MessageBody}". Converting to UCS-2 Hex for storage.`
    );
    finalContentForStorage = stringToUcs2Hex(String(smsData.MessageBody));
  }

  const newSms = {
    id: mockState.sms_id_counter.toString(),
    number: smsData.Number,
    content: finalContentForStorage,
    date: smsData.sms_time.replace(/;/g, ','),
    tag: smsData.tag || '2',
    draft_group_id: smsData.draft_group_id || '',
    encode_type: 'UCS2',
  };
  mockState.sms_messages.push(newSms);

  if (newSms.tag === '2') {
    mockState.sms_capacity_info.sms_nv_send_total = (
      parseInt(mockState.sms_capacity_info.sms_nv_send_total) + 1
    ).toString();
  } else if (newSms.tag === '1') {
    mockState.sms_capacity_info.sms_nv_rev_total = (
      parseInt(mockState.sms_capacity_info.sms_nv_rev_total) + 1
    ).toString();
    mockState.sms_unread_num = (
      parseInt(mockState.sms_unread_num) + 1
    ).toString();
    mockState.sms_received_flag = '1';
  }

  if (
    newSms.tag === '2' &&
    mockState.sms_parameter_info.sms_para_status_report === '1'
  ) {
    setTimeout(
      () => {
        mockState.sms_id_counter += 1;
        const reportContentReadable = `Delivery Report: Message to ${newSms.number} successfully delivered.`;
        const reportSms = {
          id: mockState.sms_id_counter.toString(),
          number: newSms.number,
          content: stringToUcs2Hex(reportContentReadable),
          date:
            new Date()
              .toLocaleDateString('en-CA', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
              })
              .replace(/-/g, ',') +
            ',' +
            new Date().toLocaleTimeString('en-GB').replace(/:/g, ','),
          tag: '5',
          draft_group_id: newSms.id,
          encode_type: 'UCS2',
        };
        mockState.sms_messages.push(reportSms);
        mockState.sts_received_flag = '1';
        console.log(
          'Simulated delivery report (content UCS-2 Hex encoded):',
          reportSms.content
        );
      },
      getRandomInt(2000, 7000)
    );
  }
  return newSms;
};

export const deleteSms = (ids) => {
  const initialCount = mockState.sms_messages.length;
  let deletedNvRev = 0;
  let deletedNvSend = 0;
  mockState.sms_messages = mockState.sms_messages.filter((sms) => {
    if (ids.includes(sms.id)) {
      if (sms.tag === '0' || sms.tag === '1') {
        deletedNvRev++;
        if (sms.tag === '1')
          mockState.sms_unread_num = (
            parseInt(mockState.sms_unread_num) - 1
          ).toString();
      } else if (sms.tag === '2') {
        deletedNvSend++;
      }
      return false;
    }
    return true;
  });
  mockState.sms_capacity_info.sms_nv_rev_total = Math.max(
    0,
    parseInt(mockState.sms_capacity_info.sms_nv_rev_total) - deletedNvRev
  ).toString();
  mockState.sms_capacity_info.sms_nv_send_total = Math.max(
    0,
    parseInt(mockState.sms_capacity_info.sms_nv_send_total) - deletedNvSend
  ).toString();
  mockState.sms_unread_num = Math.max(
    0,
    parseInt(mockState.sms_unread_num)
  ).toString();
  if (parseInt(mockState.sms_unread_num) === 0)
    mockState.sms_received_flag = '0';
  return mockState.sms_messages.length < initialCount;
};

export const setSmsRead = (ids) => {
  let readCount = 0;
  mockState.sms_messages.forEach((sms) => {
    if (ids.includes(sms.id) && sms.tag === '1') {
      sms.tag = '0';
      readCount++;
    }
  });
  if (readCount > 0) {
    mockState.sms_unread_num = Math.max(
      0,
      parseInt(mockState.sms_unread_num) - readCount
    ).toString();
    if (parseInt(mockState.sms_unread_num) === 0)
      mockState.sms_received_flag = '0';
  }
  return true;
};

export const addPhonebookEntry = (entryData) => {
  mockState.pbm_id_counter += 1;
  // Store contact names and emails as UCS-2 Hex
  const newEntry = {
    pbm_id: mockState.pbm_id_counter.toString(),
    pbm_location: entryData.location,
    pbm_name: stringToUcs2Hex(entryData.name || ''),
    pbm_number: entryData.mobilephone_num,
    pbm_anr: entryData.homephone_num || '',
    pbm_anr1: entryData.officephone_num || '',
    pbm_group: entryData.groupchoose || 'Common',
    pbm_email: entryData.email
      ? stringToUcs2Hex(entryData.email)
      : stringToUcs2Hex(''),
  };
  mockState.phonebook_entries.push(newEntry);
  if (newEntry.pbm_location === '0') {
    mockState.pbm_capacity_info.pbm_sim_used_record_num = (
      parseInt(mockState.pbm_capacity_info.pbm_sim_used_record_num) + 1
    ).toString();
  } else {
    mockState.pbm_capacity_info.pbm_dev_used_record_num = (
      parseInt(mockState.pbm_capacity_info.pbm_dev_used_record_num) + 1
    ).toString();
  }
  return newEntry;
};

export const deletePhonebookEntries = (ids) => {
  const initialCount = mockState.phonebook_entries.length;
  mockState.phonebook_entries = mockState.phonebook_entries.filter((entry) => {
    if (ids.includes(entry.pbm_id)) {
      if (entry.pbm_location === '0') {
        mockState.pbm_capacity_info.pbm_sim_used_record_num = Math.max(
          0,
          parseInt(mockState.pbm_capacity_info.pbm_sim_used_record_num) - 1
        ).toString();
      } else {
        mockState.pbm_capacity_info.pbm_dev_used_record_num = Math.max(
          0,
          parseInt(mockState.pbm_capacity_info.pbm_dev_used_record_num) - 1
        ).toString();
      }
      return false;
    }
    return true;
  });
  return mockState.phonebook_entries.length < initialCount;
};

export { mockState as _internalMockState };
// toBase64 and ucs2HexDecode are removed. stringToUcs2Hex is kept and exported.
