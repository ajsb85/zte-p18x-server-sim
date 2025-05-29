// routes/api.js
const express = require('express');
const router = express.Router(); // Create a new router object
const mockData = require('../data/mockData'); // Ensure this path is correct

// GET /goform/goform_get_cmd_process
// This will handle requests to /goform/goform_get_cmd_process because the router is mounted at / in server.js
router.get('/goform/goform_get_cmd_process', (req, res) => {
  const cmd = req.query.cmd;
  const isMulti = req.query.isMulti || '0'; // Default to "0" if not provided

  if (!cmd) {
    return res.status(400).json({ error: 'cmd parameter is missing' });
  }

  const commands = cmd.split(',');
  let responseData = {};

  // Special handling for single 'version_info' command (plain text response)
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

  // Process multiple commands or single commands that are not the special 'version_info' plain text case
  commands.forEach((command) => {
    const data = mockData.getState(command);
    if (data !== undefined) {
      responseData[command] = data;
    } else {
      // Handle cases where the command might refer to a nested object key
      // This part might need expansion based on all possible 'cmd' values
      if (command === 'sms_capacity_info') {
        responseData[command] = mockData.getState('sms_capacity_info');
      } else if (command === 'pbm_capacity_info') {
        responseData[command] = mockData.getState('pbm_capacity_info');
      } else if (command === 'sms_parameter_info') {
        responseData[command] = mockData.getState('sms_parameter_info');
      } else if (command === 'ussd_data_info') {
        responseData[command] = mockData.getState('ussd_data_info');
      } else if (command === 'version_info') {
        // If version_info is part of a multi-command request
        responseData[command] = mockData.getState('version_info');
      } else {
        // Optionally, you could set a specific value or error for unknown commands
        // responseData[command] = `Unknown command: ${command}`;
      }
    }
  });

  // Specific handling for sms_data_total (SMS list)
  if (
    commands.includes('sms_data_total') ||
    commands.includes('sms_page_data')
  ) {
    // TODO: Implement pagination and filtering based on query params:
    // const page = parseInt(req.query.page, 10) || 0;
    // const data_per_page = parseInt(req.query.data_per_page, 10) || 10;
    // const mem_store = req.query.mem_store; // 0 for SIM, 1 for device (nv)
    // const tags = req.query.tags; // 0:read, 1:unread, 2:sent, 3:failed, 4:draft, 10:all
    // const orderBy = req.query.order_by;
    responseData.messages = mockData.getState('sms_messages'); // Currently returns all
  }

  // Specific handling for phonebook
  if (
    commands.includes('pbm_data_total') ||
    commands.includes('pbm_data_info')
  ) {
    // TODO: Implement pagination and filtering if needed
    responseData.pbm_data = mockData.getState('phonebook_entries'); // Currently returns all
  }

  console.log(
    `GET /goform/goform_get_cmd_process?cmd=${cmd} -> Response (first 200 chars):`,
    JSON.stringify(responseData).substring(0, 200) + '...'
  );
  res.json(responseData);
});

// POST /goform/goform_set_cmd_process
// This will handle requests to /goform/goform_set_cmd_process
router.post('/goform/goform_set_cmd_process', (req, res) => {
  const goformId = req.body.goformId;
  if (!goformId) {
    return res.status(400).json({ error: 'goformId parameter is missing' });
  }

  console.log(
    `POST /goform/goform_set_cmd_process, goformId: ${goformId}, Body:`,
    req.body
  );
  let responseData = { result: 'success' }; // Default success response

  switch (goformId) {
    case 'LOGIN':
      if (req.body.password === mockData.getState('admin_Password')) {
        mockData.setState('loginfo', 'ok');
        responseData.result = '0'; // Success for login
      } else {
        responseData.result = '3'; // Error_code 3 for bad password
      }
      break;
    case 'LOGOUT':
      mockData.setState('loginfo', 'no');
      responseData.result = 'success'; // Or "0" if device expects that
      break;
    case 'SEND_SMS':
      // Simulate async processing for SEND_SMS
      mockData.setState('sms_cmd_status_info', {
        sms_cmd: 4,
        sms_cmd_status_result: '1',
      }); // Processing

      // Send immediate acknowledgement
      res.json({ result: 'success' }); // Important: respond before setTimeout completes

      setTimeout(() => {
        try {
          const newSms = mockData.addSms({
            Number: req.body.Number,
            MessageBody: req.body.MessageBody,
            sms_time: req.body.sms_time,
            draft_group_id: req.body.draft_group_id || '',
          });
          // responseData.new_sms_id = newSms.id; // This won't be sent as response already sent
          mockData.setState('sms_cmd_status_info', {
            sms_cmd: 4,
            sms_cmd_status_result: '3',
          }); // Success
          console.log(
            'SEND_SMS processed asynchronously, new SMS ID:',
            newSms.id
          );
        } catch (error) {
          console.error('Error processing SEND_SMS asynchronously:', error);
          mockData.setState('sms_cmd_status_info', {
            sms_cmd: 4,
            sms_cmd_status_result: '4',
          }); // Error
        }
      }, 1500); // Simulate delay
      return; // Explicitly return to prevent further processing for this case after res.json
    case 'SET_MSG_READ':
      const msg_ids_read = req.body.msg_id.split(';').filter((id) => id);
      mockData.setSmsRead(msg_ids_read);
      responseData.result = 'success';
      break;
    case 'DELETE_SMS':
      const msg_ids_delete = req.body.msg_id.split(';').filter((id) => id);
      mockData.deleteSms(msg_ids_delete);
      mockData.setState('sms_cmd_status_info', {
        sms_cmd: 6,
        sms_cmd_status_result: '1',
      }); // Processing

      res.json({ result: 'success' }); // Send immediate ack

      setTimeout(() => {
        mockData.setState('sms_cmd_status_info', {
          sms_cmd: 6,
          sms_cmd_status_result: '3',
        }); // Success
      }, 500);
      return; // Explicitly return
    case 'CONNECT_NETWORK':
      mockData.setState('ppp_status', 'ppp_connecting');
      setTimeout(() => mockData.setState('ppp_status', 'ppp_connected'), 2000);
      responseData.result = 'success';
      break;
    case 'DISCONNECT_NETWORK':
      mockData.setState('ppp_status', 'ppp_disconnecting');
      setTimeout(
        () => mockData.setState('ppp_status', 'ppp_disconnected'),
        1000
      );
      responseData.result = 'success';
      break;
    case 'SET_WEB_LANGUAGE':
      mockData.setState('language', req.body.Language);
      responseData.result = 'success';
      break;
    case 'PBM_CONTACT_ADD':
      mockData.addPhonebookEntry(req.body);
      mockData.setState('pbm_write_flag', '1'); // Busy
      setTimeout(() => mockData.setState('pbm_write_flag', '0'), 1000); // Ready
      responseData.result = 'success';
      break;
    case 'PBM_CONTACT_DEL':
      const ids_to_delete = req.body.delete_id.split(',').filter((id) => id);
      mockData.deletePhonebookEntries(ids_to_delete);
      mockData.setState('pbm_write_flag', '1');
      setTimeout(() => mockData.setState('pbm_write_flag', '0'), 1000);
      responseData.result = 'success';
      break;
    case 'USSD_PROCESS':
      const ussdOperator = req.body.USSD_operator;

      res.json({ result: 'success' }); // USSD usually responds success immediately

      if (ussdOperator === 'ussd_send' || ussdOperator === 'ussd_reply') {
        const command = req.body.USSD_send_number || req.body.USSD_reply_number;
        mockData.setState('ussd_write_flag', '15'); // Processing
        setTimeout(() => {
          mockData.setState('ussd_write_flag', '16'); // Ready with response
          let responseText = `Mock USSD Response to: ${command}. `;
          if (command === '*123#')
            responseText += 'Your balance is $10.50. Reply 1 for more options.';
          else responseText += 'Operation successful.';

          mockData.setState('ussd_data_info', {
            ussd_data: Buffer.from(responseText).toString('base64'),
            ussd_action: command === '*123#' ? '0' : '1',
          });
        }, 2000);
      } else if (ussdOperator === 'ussd_cancel') {
        mockData.setState('ussd_write_flag', '13'); // Cancelled
        mockData.setState('ussd_data_info', {
          ussd_data: '',
          ussd_action: '2',
        });
      }
      return; // Explicitly return
    case 'SET_WIFI_SSID1_SETTINGS':
      mockData.setState('SSID1', req.body.ssid);
      mockData.setState('AuthMode', req.body.security_mode);
      // Ensure correct boolean to string conversion for HideSSID if device expects "0" or "1"
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
      console.warn(`Unhandled goformId: ${goformId}`);
      responseData.result = 'failure'; // Or a more specific error code
      break;
  }

  // Send response if not already sent by specific handlers (like SEND_SMS)
  if (!res.headersSent) {
    res.json(responseData);
  }
});

// Crucial: Export the router object
module.exports = router;
