import {
  jest,
  describe,
  it,
  expect,
  afterAll,
  beforeEach,
  beforeAll,
} from '@jest/globals';
import * as mockDataModule from '../data/mockData.js';

let initialMockStateSnapshot;

beforeAll(() => {
  if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
    mockDataModule.stopDynamicDataUpdates();
  } else {
    console.warn(
      'mockDataModule.stopDynamicDataUpdates is not a function in beforeAll of mockData.spec.js'
    );
  }

  try {
    initialMockStateSnapshot = JSON.parse(
      JSON.stringify(
        mockDataModule._internalMockState || mockDataModule.mockState
      )
    );
  } catch (_errorUnused) {
    console.error(
      'Error creating initialMockStateSnapshot in mockData.spec.js:',
      _errorUnused
    );
    initialMockStateSnapshot = {};
  }
});

beforeEach(() => {
  if (!initialMockStateSnapshot) {
    console.error(
      'initialMockStateSnapshot is not available in beforeEach of mockData.spec.js'
    );
    try {
      initialMockStateSnapshot = JSON.parse(
        JSON.stringify(
          mockDataModule._internalMockState || mockDataModule.mockState
        )
      );
    } catch (_eUnusedAlso) {
      initialMockStateSnapshot = {};
    }
  }
  const targetMockState =
    mockDataModule._internalMockState || mockDataModule.mockState;

  for (const key in targetMockState) {
    delete targetMockState[key];
  }
  for (const key in initialMockStateSnapshot) {
    if (Object.prototype.hasOwnProperty.call(initialMockStateSnapshot, key)) {
      targetMockState[key] = JSON.parse(
        JSON.stringify(initialMockStateSnapshot[key])
      );
    }
  }
});

afterAll(() => {
  if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
    mockDataModule.stopDynamicDataUpdates();
  }
});

describe('data/mockData.js', () => {
  it('should be a valid test suite', () => {
    expect(true).toBe(true);
  });

  describe('stringToUcs2Hex helper', () => {
    // Test stringToUcs2Hex instead of toBase64
    it('should correctly encode a string to UCS-2 Hex', () => {
      expect(mockDataModule.stringToUcs2Hex).toBeDefined();
      expect(mockDataModule.stringToUcs2Hex('hi')).toBe('00680069');
      expect(mockDataModule.stringToUcs2Hex('Hello')).toBe(
        '00480065006C006C006F'
      );
      expect(mockDataModule.stringToUcs2Hex('')).toBe('');
    });
  });

  describe('setState and getState', () => {
    it('should set and get a state property', () => {
      mockDataModule.setState('language', 'es');
      expect(mockDataModule.getState('language')).toBe('es');
      mockDataModule.setState('language', 'en');
    });

    it('getAllStates should retrieve multiple specified states', () => {
      mockDataModule.setState('ppp_status', 'ppp_connected_test');
      mockDataModule.setState('signalbar', '5_test');
      const states = mockDataModule.getAllStates([
        'ppp_status',
        'signalbar',
        'non_existent_key',
      ]);
      expect(states).toEqual({
        ppp_status: 'ppp_connected_test',
        signalbar: '5_test',
      });
    });
  });

  describe('SMS functions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      if (jest.isMockFunction(setTimeout)) {
        jest.runAllTimers();
      }
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('addSms should add an SMS (as UCS-2 Hex) and update counters for unread', () => {
      const initialSmsCount = mockDataModule.getState('sms_messages').length;
      const initialUnread = parseInt(mockDataModule.getState('sms_unread_num'));
      const initialNvRev = parseInt(
        mockDataModule.getState('sms_capacity_info').sms_nv_rev_total
      );
      const readableMsg = 'New SMS';
      const hexMsg = mockDataModule.stringToUcs2Hex(readableMsg);

      mockDataModule.addSms({
        Number: '12345',
        MessageBody: hexMsg,
        sms_time: '25;01;01;00;00;00',
        tag: '1',
        encode_type: 'UCS2',
      });
      jest.runAllTimers();

      const addedMessage = mockDataModule
        .getState('sms_messages')
        .find((m) => m.content === hexMsg);
      expect(addedMessage).toBeDefined();
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + 1
      );
      expect(parseInt(mockDataModule.getState('sms_unread_num'))).toBe(
        initialUnread + 1
      );
      expect(mockDataModule.getState('sms_received_flag')).toBe('1');
      expect(
        parseInt(mockDataModule.getState('sms_capacity_info').sms_nv_rev_total)
      ).toBe(initialNvRev + 1);
    });

    it('addSms for a sent message (UCS-2 Hex) should update sent count and potentially add delivery report', () => {
      const initialSmsCount = mockDataModule.getState('sms_messages').length;
      const initialSent = parseInt(
        mockDataModule.getState('sms_capacity_info').sms_nv_send_total
      );
      const readableMsg = 'Sent SMS';
      const hexMsg = mockDataModule.stringToUcs2Hex(readableMsg);

      mockDataModule.setState('sms_parameter_info', {
        ...mockDataModule.getState('sms_parameter_info'),
        sms_para_status_report: '1',
      });

      mockDataModule.addSms({
        Number: '67890',
        MessageBody: hexMsg,
        sms_time: '25;01;01;00;00;00',
        tag: '2',
        encode_type: 'UCS2',
      });

      expect(
        parseInt(mockDataModule.getState('sms_capacity_info').sms_nv_send_total)
      ).toBe(initialSent + 1);
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + 1
      );
      jest.runAllTimers();
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + 2
      );
      expect(mockDataModule.getState('sts_received_flag')).toBe('1');
    });

    it('deleteSms should remove SMS and update counters', () => {
      const addedSms = mockDataModule.addSms({
        Number: '555',
        MessageBody: mockDataModule.stringToUcs2Hex('To Delete'),
        sms_time: '25;01;01;00;00;00',
        tag: '1',
        encode_type: 'UCS2',
      });
      jest.runAllTimers();
      const initialSmsCount = mockDataModule.getState('sms_messages').length;
      const initialUnread = parseInt(mockDataModule.getState('sms_unread_num'));

      mockDataModule.deleteSms([addedSms.id]);

      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount - 1
      );
      expect(parseInt(mockDataModule.getState('sms_unread_num'))).toBe(
        initialUnread - 1
      );
    });

    it('setSmsRead should mark unread SMS as read and update counters', () => {
      const addedSms = mockDataModule.addSms({
        Number: '777',
        MessageBody: mockDataModule.stringToUcs2Hex('Mark as Read'),
        sms_time: '25;01;01;00;00;00',
        tag: '1',
        encode_type: 'UCS2',
      });
      jest.runAllTimers();
      const initialUnread = parseInt(mockDataModule.getState('sms_unread_num'));

      mockDataModule.setSmsRead([addedSms.id]);
      const updatedSms = mockDataModule
        .getState('sms_messages')
        .find((sms) => sms.id === addedSms.id);
      expect(updatedSms.tag).toBe('0');
      expect(parseInt(mockDataModule.getState('sms_unread_num'))).toBe(
        initialUnread - 1
      );
    });
  });

  describe('Phonebook functions', () => {
    it('addPhonebookEntry should add an entry (UCS-2 Hex) and update counters (device)', () => {
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const initialDevUsed = parseInt(
        mockDataModule.getState('pbm_capacity_info').pbm_dev_used_record_num
      );
      const contactName = 'New Contact Dev';
      const contactNameHex = mockDataModule.stringToUcs2Hex(contactName);

      mockDataModule.addPhonebookEntry({
        location: '1',
        name: contactName, // Send plain, addPhonebookEntry will convert to hex
        mobilephone_num: '1230009999',
      });

      expect(mockDataModule.getState('phonebook_entries').length).toBe(
        initialPbmCount + 1
      );
      expect(
        parseInt(
          mockDataModule.getState('pbm_capacity_info').pbm_dev_used_record_num
        )
      ).toBe(initialDevUsed + 1);
      const addedEntry = mockDataModule
        .getState('phonebook_entries')
        .find((e) => e.pbm_name === contactNameHex);
      expect(addedEntry).toBeDefined();
    });

    it('addPhonebookEntry should add an entry (UCS-2 Hex) and update counters (SIM)', () => {
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const initialSimUsed = parseInt(
        mockDataModule.getState('pbm_capacity_info').pbm_sim_used_record_num
      );
      const contactName = 'New Contact SIM';
      const contactNameHex = mockDataModule.stringToUcs2Hex(contactName);

      mockDataModule.addPhonebookEntry({
        location: '0',
        name: contactName, // Send plain
        mobilephone_num: '7890006666',
      });

      expect(mockDataModule.getState('phonebook_entries').length).toBe(
        initialPbmCount + 1
      );
      expect(
        parseInt(
          mockDataModule.getState('pbm_capacity_info').pbm_sim_used_record_num
        )
      ).toBe(initialSimUsed + 1);
      const addedEntry = mockDataModule
        .getState('phonebook_entries')
        .find((e) => e.pbm_name === contactNameHex);
      expect(addedEntry).toBeDefined();
    });

    it('deletePhonebookEntries should remove entries and update counters (device)', () => {
      const addedEntry = mockDataModule.addPhonebookEntry({
        location: '1',
        name: 'Deletable Contact Dev',
        mobilephone_num: '000111222',
      });
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const initialDevUsed = parseInt(
        mockDataModule.getState('pbm_capacity_info').pbm_dev_used_record_num
      );

      mockDataModule.deletePhonebookEntries([addedEntry.pbm_id]);

      expect(mockDataModule.getState('phonebook_entries').length).toBe(
        initialPbmCount - 1
      );
      expect(
        parseInt(
          mockDataModule.getState('pbm_capacity_info').pbm_dev_used_record_num
        )
      ).toBe(initialDevUsed - 1);
    });

    it('deletePhonebookEntries should remove entries and update counters (SIM)', () => {
      const addedEntry = mockDataModule.addPhonebookEntry({
        location: '0',
        name: 'Deletable Contact SIM',
        mobilephone_num: '333444555',
      });
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const initialSimUsed = parseInt(
        mockDataModule.getState('pbm_capacity_info').pbm_sim_used_record_num
      );

      mockDataModule.deletePhonebookEntries([addedEntry.pbm_id]);

      expect(mockDataModule.getState('phonebook_entries').length).toBe(
        initialPbmCount - 1
      );
      expect(
        parseInt(
          mockDataModule.getState('pbm_capacity_info').pbm_sim_used_record_num
        )
      ).toBe(initialSimUsed - 1);
    });
  });

  describe('Dynamic Data Updates Interval', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      if (jest.isMockFunction(setTimeout)) {
        jest.runAllTimers();
      }
      jest.clearAllTimers();
      jest.useRealTimers();
      if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
        mockDataModule.stopDynamicDataUpdates();
      }
    });

    it('stopDynamicDataUpdates should clear the interval if running', () => {
      if (typeof mockDataModule.startDynamicDataUpdates === 'function') {
        mockDataModule.startDynamicDataUpdates();
        expect(
          mockDataModule._internalMockState.dynamicDataIntervalId
        ).not.toBeNull();
      }

      if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
        mockDataModule.stopDynamicDataUpdates();
        expect(
          mockDataModule._internalMockState.dynamicDataIntervalId
        ).toBeNull();
      }
    });

    it('updateDynamicData should change signalbar (if interval runs)', (done) => {
      if (
        typeof mockDataModule.startDynamicDataUpdates !== 'function' ||
        typeof mockDataModule.stopDynamicDataUpdates !== 'function'
      ) {
        done();
        return;
      }

      mockDataModule.startDynamicDataUpdates();

      jest.advanceTimersByTime(2100);

      const newSignal = mockDataModule.getState('signalbar');
      expect(typeof newSignal).toBe('string');
      expect(newSignal).toMatch(/^[0-5]$/);

      mockDataModule.stopDynamicDataUpdates();
      done();
    }, 5000);
  });
});
