// routes/api.js
import express from 'express';
import * as mockData from '../data/mockData.js';

const router = express.Router();

// GET /goform/goform_get_cmd_process
router.get('/goform/goform_get_cmd_process', (req, res) => {
  const cmd = req.query.cmd;
  const isMulti = req.query.isMulti || '0';

  if (!cmd) {
    return res.status(400).json({ error: 'cmd parameter is missing' });
  }

  const commands = cmd.split(',');
  let responseData = {};

  if (commands.length === 1 && cmd === 'version_info' && isMulti === '0') {
    const versionInfo = mockData.getState('version_info');
    if (
      versionInfo &&
      versionInfo.software_version &&
      versionInfo.inner_software_version
    ) {
      return res
        .type('text/plain')
        .send(
          `software_version=${versionInfo.software_version}\ninner_software_version=${versionInfo.inner_software_version}`
        );
    } else {
      return res
        .status(404)
        .type('text/plain')
        .send('version_info_not_found_in_mockData');
    }
  }

  commands.forEach((command) => {
    const data = mockData.getState(command);
    if (data !== undefined) {
      responseData[command] = data;
    } else {
      if (command === 'sms_capacity_info') {
        responseData[command] = mockData.getState('sms_capacity_info');
      } else if (command === 'pbm_capacity_info') {
        responseData[command] = mockData.getState('pbm_capacity_info');
      } else if (command === 'sms_parameter_info') {
        responseData[command] = mockData.getState('sms_parameter_info');
      } else if (command === 'ussd_data_info') {
        responseData[command] = mockData.getState('ussd_data_info');
      } else if (command === 'version_info') {
        responseData[command] = mockData.getState('version_info');
      }
      // Add more known complex object keys here if needed
    }
  });

  if (
    commands.includes('sms_data_total') ||
    commands.includes('sms_page_data')
  ) {
    responseData.messages = mockData.getState('sms_messages');
  }

  // Ensure 'messages' array exists if 'sms_status_rpt_data' is requested
  if (commands.includes('sms_status_rpt_data')) {
    // The actual device might return specific status report objects here.
    // For now, we'll ensure the 'messages' key exists, defaulting to an empty array.
    // If you have examples of what these status reports look like, we can mock them.
    if (!responseData.messages) {
      // Could be combined with sms_data_total
      responseData.messages = []; // Default to empty array for status reports
    }
    // If specific status report data needs to be part of responseData.sms_status_rpt_data, add it here.
    // For example: responseData.sms_status_rpt_data = { some_status_key: "value" };
    // However, the error is `aRequest.messages`, so ensuring `messages` key is present is primary.
  }

  if (
    commands.includes('pbm_data_total') ||
    commands.includes('pbm_data_info')
  ) {
    responseData.pbm_data = mockData.getState('phonebook_entries');
  }

  console.log(
    `GET /goform/goform_get_cmd_process?cmd=${cmd} -> Response (first 200 chars):`,
    JSON.stringify(responseData).substring(0, 200) + '...'
  );
  res.json(responseData);
});

// POST /goform/goform_set_cmd_process
router.post('/goform/goform_set_cmd_process', (req, res, next) => {
  if (req.body) {
    console.log(
      `POST /goform/goform_set_cmd_process received. Raw Body (first 100 chars):`,
      JSON.stringify(req.body).substring(0, 100)
    );
  } else {
    console.log(
      `POST /goform/goform_set_cmd_process received. req.body is undefined or null.`
    );
  }
  console.log(`Request Content-Type: ${req.get('Content-Type')}`);

  try {
    const goformId = req.body ? req.body.goformId : undefined;
    if (!goformId) {
      console.error(
        'goformId is missing in POST request body or req.body is undefined. Full body:',
        req.body
      );
      return res
        .status(400)
        .json({
          error:
            'goformId parameter is missing in request body or body is malformed',
        });
    }

    console.log(
      `Processing POST /goform/goform_set_cmd_process, goformId: ${goformId}, Full Body:`,
      req.body
    );
    let responseData = { result: 'success' };

    switch (goformId) {
      case 'LOGIN': {
        if (req.body.password === mockData.getState('admin_Password')) {
          mockData.setState('loginfo', 'ok');
          responseData.result = '0';
        } else {
          responseData.result = '3';
        }
        break;
      }
      case 'LOGOUT':
        mockData.setState('loginfo', 'no');
        responseData.result = 'success';
        break;
      case 'SEND_SMS': {
        if (!req.body.Number || !req.body.MessageBody || !req.body.sms_time) {
          console.error('SEND_SMS missing required fields:', req.body);
          return res
            .status(400)
            .json({ result: 'failure', error: 'Missing fields for SEND_SMS' });
        }
        res.json({ result: 'success' });

        mockData.setState('sms_cmd_status_info', {
          sms_cmd: 4,
          sms_cmd_status_result: '3',
        });

        setTimeout(() => {
          try {
            const newSms = mockData.addSms({
              Number: req.body.Number,
              MessageBody: req.body.MessageBody,
              sms_time: req.body.sms_time,
              draft_group_id: req.body.draft_group_id || '',
              encode_type: req.body.encode_type,
            });
            console.log('SEND_SMS added to mockData, new SMS ID:', newSms.id);
          } catch (error) {
            console.error(
              'Error processing SEND_SMS (simulated async add):',
              error
            );
          }
        }, 10);
        return;
      }
      case 'SET_MESSAGE_CENTER': {
        const newSmsParams = { ...mockData.getState('sms_parameter_info') };
        if (req.body.MessageCenter !== undefined) {
          newSmsParams.sms_para_sca = req.body.MessageCenter;
        }
        if (req.body.save_time !== undefined) {
          const validityMap = {
            default: '143',
            one_hour: '11',
            six_hours: '71',
            twelve_hours: '143',
            one_day: '167',
            one_week: '173',
            largest_period: '255',
            largest: '255',
          };
          newSmsParams.sms_para_validity_period =
            validityMap[req.body.save_time.toLowerCase()] ||
            newSmsParams.sms_para_validity_period;
        }
        if (req.body.status_save !== undefined) {
          newSmsParams.sms_para_status_report = req.body.status_save;
        }
        if (req.body.save_location !== undefined) {
          newSmsParams.sms_para_mem_store =
            req.body.save_location === 'native' ? 'nv' : req.body.save_location;
        }
        mockData.setState('sms_parameter_info', newSmsParams);
        console.log('Updated SMS Parameters:', newSmsParams);
        responseData.result = 'success';
        break;
      }
      case 'SET_MSG_READ': {
        if (!req.body.msg_id) {
          return res
            .status(400)
            .json({
              result: 'failure',
              error: 'Missing msg_id for SET_MSG_READ',
            });
        }
        const msg_ids_read = req.body.msg_id.split(';').filter((id) => id);
        mockData.setSmsRead(msg_ids_read);
        responseData.result = 'success';
        break;
      }
      case 'DELETE_SMS': {
        if (!req.body.msg_id) {
          return res
            .status(400)
            .json({
              result: 'failure',
              error: 'Missing msg_id for DELETE_SMS',
            });
        }
        const msg_ids_delete = req.body.msg_id.split(';').filter((id) => id);
        mockData.deleteSms(msg_ids_delete);
        res.json({ result: 'success' });
        mockData.setState('sms_cmd_status_info', {
          sms_cmd: 6,
          sms_cmd_status_result: '3',
        });
        return;
      }
      case 'CONNECT_NETWORK':
        mockData.setState('ppp_status', 'ppp_connecting');
        setTimeout(() => mockData.setState('ppp_status', 'ppp_connected'), 50);
        responseData.result = 'success';
        break;
      case 'DISCONNECT_NETWORK':
        mockData.setState('ppp_status', 'ppp_disconnecting');
        setTimeout(
          () => mockData.setState('ppp_status', 'ppp_disconnected'),
          50
        );
        responseData.result = 'success';
        break;
      case 'SET_WEB_LANGUAGE':
        if (!req.body.Language) {
          return res
            .status(400)
            .json({
              result: 'failure',
              error: 'Missing Language for SET_WEB_LANGUAGE',
            });
        }
        mockData.setState('language', req.body.Language);
        responseData.result = 'success';
        break;
      case 'PBM_CONTACT_ADD':
        if (!req.body.name || !req.body.mobilephone_num) {
          return res
            .status(400)
            .json({
              result: 'failure',
              error: 'Missing name or mobilephone_num for PBM_CONTACT_ADD',
            });
        }
        mockData.addPhonebookEntry(req.body);
        res.json({ result: 'success' });
        mockData.setState('pbm_write_flag', '1');
        setTimeout(() => mockData.setState('pbm_write_flag', '0'), 50);
        return;
      case 'PBM_CONTACT_DEL': {
        if (!req.body.delete_id) {
          return res
            .status(400)
            .json({
              result: 'failure',
              error: 'Missing delete_id for PBM_CONTACT_DEL',
            });
        }
        const ids_to_delete = req.body.delete_id.split(',').filter((id) => id);
        mockData.deletePhonebookEntries(ids_to_delete);
        res.json({ result: 'success' });
        mockData.setState('pbm_write_flag', '1');
        setTimeout(() => mockData.setState('pbm_write_flag', '0'), 50);
        return;
      }
      case 'USSD_PROCESS': {
        if (!req.body.USSD_operator) {
          return res
            .status(400)
            .json({
              result: 'failure',
              error: 'Missing USSD_operator for USSD_PROCESS',
            });
        }
        const ussdOperator = req.body.USSD_operator;
        res.json({ result: 'success' });
        if (ussdOperator === 'ussd_send' || ussdOperator === 'ussd_reply') {
          const command =
            req.body.USSD_send_number || req.body.USSD_reply_number;
          if (!command) {
            console.error(
              'USSD_PROCESS missing USSD_send_number or USSD_reply_number'
            );
            return;
          }
          mockData.setState('ussd_write_flag', '15');
          setTimeout(() => {
            mockData.setState('ussd_write_flag', '16');
            let responseText = `Mock USSD Response to: ${command}. `;
            if (command === '*123#')
              responseText +=
                'Your balance is $10.50. Reply 1 for more options.';
            else responseText += 'Operation successful.';
            mockData.setState('ussd_data_info', {
              ussd_data: responseText,
              ussd_action: command === '*123#' ? '0' : '1',
            });
          }, 50);
        } else if (ussdOperator === 'ussd_cancel') {
          mockData.setState('ussd_write_flag', '13');
          mockData.setState('ussd_data_info', {
            ussd_data: '',
            ussd_action: '2',
          });
        }
        return;
      }
      case 'SET_WIFI_SSID1_SETTINGS':
        mockData.setState('SSID1', req.body.ssid);
        mockData.setState('AuthMode', req.body.security_mode);
        mockData.setState(
          'HideSSID',
          req.body.broadcastSsidEnabled === 'true' ||
            req.body.broadcastSsidEnabled === '1'
            ? '1'
            : '0'
        );
        mockData.setState('WPAPSK1', req.body.passphrase);
        mockData.setState('MAX_Access_num', req.body.MAX_Access_num);
        responseData.result = 'success';
        break;
      default:
        console.warn(`Unhandled goformId in POST: ${goformId}`);
        return res
          .status(400)
          .json({
            result: 'failure',
            error: `Unhandled goformId: ${goformId}`,
          });
    }

    if (!res.headersSent) {
      res.json(responseData);
    }
  } catch (error) {
    console.error(
      `Error in POST /goform/goform_set_cmd_process (goformId: ${req.body ? req.body.goformId : 'N/A'}):`,
      error.stack || error
    );
    next(error);
  }
});

export default router;
