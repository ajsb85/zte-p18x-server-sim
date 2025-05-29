import {
  jest,
  describe,
  it,
  expect,
  afterAll,
  beforeEach,
  afterEach,
} from '@jest/globals'; // Import Jest globals
import request from 'supertest';
import app from '../server.js';
import * as mockDataModule from '../data/mockData.js';

describe('ZTE P18X API Simulator', () => {
  afterAll(() => {
    if (mockDataModule.stopDynamicDataUpdates) {
      mockDataModule.stopDynamicDataUpdates();
    }
  });

  beforeEach(() => {
    mockDataModule.setState('ppp_status', 'ppp_disconnected');
    mockDataModule.setState('loginfo', 'no');
    mockDataModule.setState('ussd_write_flag', '0');
    mockDataModule.setState('pbm_write_flag', '0');
    mockDataModule.setState('sms_cmd_status_info', {
      sms_cmd: 0,
      sms_cmd_status_result: '0',
    });
  });

  describe('Basic Server and Routing Checks', () => {
    it('should respond with 404 for a non-existent route', async () => {
      const response = await request(app).get('/a-route-that-does-not-exist');
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Not Found');
    });

    it('GET /zte_web/web/version should return version string', async () => {
      const response = await request(app).get('/zte_web/web/version');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/plain/);
      const versionInfo = mockDataModule.getState('version_info');
      expect(versionInfo).toBeDefined();
      expect(response.text).toContain(
        `software_version=${versionInfo.software_version}`
      );
      expect(response.text).toContain(
        `inner_software_version=${versionInfo.inner_software_version}`
      );
    });
  });

  describe('GET /goform/goform_get_cmd_process', () => {
    it('should return multiple status fields as JSON when isMulti=1', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=loginfo,signalbar,ppp_status&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('loginfo');
      expect(response.body).toHaveProperty('signalbar');
      expect(response.body).toHaveProperty('ppp_status');
    });

    it('should return version_info as plain text for single cmd (isMulti=0 or default)', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=version_info'
      );
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    it('should return version_info as JSON when cmd=version_info and isMulti=1', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=version_info&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('version_info');
    });

    it('should return specific data objects like sms_capacity_info', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=sms_capacity_info&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('sms_capacity_info');
      expect(response.body.sms_capacity_info.sms_nv_total).toBeDefined();
    });

    it('should return pbm_capacity_info', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=pbm_capacity_info&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('pbm_capacity_info');
    });

    it('should return sms_parameter_info', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=sms_parameter_info&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('sms_parameter_info');
    });

    it('should return ussd_data_info and ussd_write_flag', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=ussd_data_info,ussd_write_flag&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('ussd_data_info');
      expect(response.body).toHaveProperty('ussd_write_flag');
    });

    it('should return sms_messages for cmd=sms_data_total', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=sms_data_total&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    it('should return pbm_data for cmd=pbm_data_total', async () => {
      const response = await request(app).get(
        '/goform/goform_get_cmd_process?cmd=pbm_data_total&isMulti=1'
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('pbm_data');
      expect(Array.isArray(response.body.pbm_data)).toBe(true);
    });

    it('should return 400 if cmd parameter is missing', async () => {
      const response = await request(app).get('/goform/goform_get_cmd_process');
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'cmd parameter is missing');
    });
  });

  describe('POST /goform/goform_set_cmd_process', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      if (jest.isMockFunction(setTimeout) || jest.isMockFunction(setInterval)) {
        jest.runAllTimers();
      }
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should login successfully with correct password', async () => {
      mockDataModule.setState('loginfo', 'no');
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'LOGIN', password: 'admin' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: '0' });
    });

    it('should fail login with incorrect password', async () => {
      mockDataModule.setState('loginfo', 'no');
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'LOGIN', password: 'wrongpassword' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: '3' });
    });

    it('should logout successfully', async () => {
      mockDataModule.setState('loginfo', 'ok');
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'LOGOUT' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('loginfo')).toBe('no');
    });

    it('should handle SEND_SMS command', async () => {
      const initialSmsCount = mockDataModule.getState('sms_messages').length;
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({
          goformId: 'SEND_SMS',
          Number: '+1234567890',
          MessageBody: mockDataModule.toBase64('Hello test'),
          sms_time: '24;01;01;12;00;00',
          ID: '-1',
          encode_type: 'GSM7_default',
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('sms_cmd_status_info')).toEqual({
        sms_cmd: 4,
        sms_cmd_status_result: '1',
      });

      jest.runAllTimers();

      const expectedNewMessages =
        mockDataModule.getState('sms_parameter_info').sms_para_status_report ===
        '1'
          ? 2
          : 1;
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + expectedNewMessages
      );
      expect(mockDataModule.getState('sms_cmd_status_info')).toEqual({
        sms_cmd: 4,
        sms_cmd_status_result: '3',
      });
    });

    it('should handle SET_MSG_READ command', async () => {
      mockDataModule.addSms({
        Number: '999888777',
        MessageBody: mockDataModule.toBase64('Unread Test SMS'),
        sms_time: '25;01;01;10;10;10',
        tag: '1',
      });
      const unreadSms = mockDataModule
        .getState('sms_messages')
        .find(
          (sms) =>
            sms.tag === '1' &&
            sms.content === mockDataModule.toBase64('Unread Test SMS')
        );
      expect(unreadSms).toBeDefined();

      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'SET_MSG_READ', msg_id: unreadSms.id });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: 'success' });
      const updatedSms = mockDataModule
        .getState('sms_messages')
        .find((m) => m.id === unreadSms.id);
      expect(updatedSms.tag).toBe('0');
    });

    it('should handle DELETE_SMS command', async () => {
      mockDataModule.addSms({
        Number: '111222333',
        MessageBody: mockDataModule.toBase64('SMS to Delete'),
        sms_time: '25;01;01;11;11;11',
        tag: '0',
      });
      const smsToDelete = mockDataModule
        .getState('sms_messages')
        .find(
          (sms) => sms.content === mockDataModule.toBase64('SMS to Delete')
        );
      expect(smsToDelete).toBeDefined();
      const initialSmsCount = mockDataModule.getState('sms_messages').length;

      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'DELETE_SMS', msg_id: smsToDelete.id });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('sms_cmd_status_info')).toEqual({
        sms_cmd: 6,
        sms_cmd_status_result: '1',
      });

      jest.runAllTimers();
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount - 1
      );
      expect(
        mockDataModule
          .getState('sms_messages')
          .find((m) => m.id === smsToDelete.id)
      ).toBeUndefined();
      expect(mockDataModule.getState('sms_cmd_status_info')).toEqual({
        sms_cmd: 6,
        sms_cmd_status_result: '3',
      });
    });

    it('should handle CONNECT_NETWORK and DISCONNECT_NETWORK', async () => {
      let response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'CONNECT_NETWORK' });
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('ppp_status')).toBe('ppp_connecting');
      jest.runAllTimers();
      expect(mockDataModule.getState('ppp_status')).toBe('ppp_connected');

      response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'DISCONNECT_NETWORK' });
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('ppp_status')).toBe('ppp_disconnecting');
      jest.runAllTimers();
      expect(mockDataModule.getState('ppp_status')).toBe('ppp_disconnected');
    });

    it('should handle PBM_CONTACT_ADD', async () => {
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const newContactNameBase64 = mockDataModule.toBase64(
        'Test Add Contact API'
      );
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({
          goformId: 'PBM_CONTACT_ADD',
          location: '1',
          name: newContactNameBase64,
          mobilephone_num: '1234509876',
          groupchoose: 'TestGroup',
        });
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('pbm_write_flag')).toBe('1');
      jest.runAllTimers();
      expect(mockDataModule.getState('pbm_write_flag')).toBe('0');
      expect(mockDataModule.getState('phonebook_entries').length).toBe(
        initialPbmCount + 1
      );
      expect(
        mockDataModule
          .getState('phonebook_entries')
          .find((c) => c.pbm_name === newContactNameBase64)
      ).toBeDefined();
    });

    it('should handle PBM_CONTACT_DEL', async () => {
      const contactToDelNameBase64 = mockDataModule.toBase64(
        'Contact ToDelete API'
      );
      mockDataModule.addPhonebookEntry({
        location: '1',
        name: contactToDelNameBase64,
        mobilephone_num: '111222333',
      });
      const entryToDel = mockDataModule
        .getState('phonebook_entries')
        .find((c) => c.pbm_name === contactToDelNameBase64);
      expect(entryToDel).toBeDefined();
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;

      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'PBM_CONTACT_DEL', delete_id: entryToDel.pbm_id });
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('pbm_write_flag')).toBe('1');
      jest.runAllTimers();
      expect(mockDataModule.getState('pbm_write_flag')).toBe('0');
      expect(mockDataModule.getState('phonebook_entries').length).toBe(
        initialPbmCount - 1
      );
      expect(
        mockDataModule
          .getState('phonebook_entries')
          .find((c) => c.pbm_id === entryToDel.pbm_id)
      ).toBeUndefined();
    });

    it('should handle USSD_PROCESS (send)', async () => {
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({
          goformId: 'USSD_PROCESS',
          USSD_operator: 'ussd_send',
          USSD_send_number: '*100#',
        });
      expect(response.body).toEqual({ result: 'success' });
      expect(mockDataModule.getState('ussd_write_flag')).toBe('15');
      jest.runAllTimers();
      expect(mockDataModule.getState('ussd_write_flag')).toBe('16');
      expect(mockDataModule.getState('ussd_data_info').ussd_data).toBeDefined();
      expect(mockDataModule.getState('ussd_data_info').ussd_action).toBe('1');
    });

    it('should handle SET_WIFI_SSID1_SETTINGS', async () => {
      const newSsid = 'MyNewWiFi';
      const newPass = 'SuperSecret123';
      await request(app).post('/goform/goform_set_cmd_process').send({
        goformId: 'SET_WIFI_SSID1_SETTINGS',
        ssid: newSsid,
        security_mode: 'WPA2PSK',
        broadcastSsidEnabled: 'true',
        passphrase: newPass,
        MAX_Access_num: '8',
      });
      expect(mockDataModule.getState('SSID1')).toBe(newSsid);
      expect(mockDataModule.getState('HideSSID')).toBe('1');
      expect(mockDataModule.getState('WPAPSK1')).toBe(newPass);
    });

    it('should return 400 if goformId is missing in POST', async () => {
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ some_other_param: 'value' });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'goformId parameter is missing'
      );
    });

    it('should return failure for unknown goformId', async () => {
      const response = await request(app)
        .post('/goform/goform_set_cmd_process')
        .send({ goformId: 'UNKNOWN_GOFORM_ID' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ result: 'failure' });
    });
  });
});
