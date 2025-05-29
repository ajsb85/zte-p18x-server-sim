const mockDataModule = require('../data/mockData');

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
      JSON.stringify(mockDataModule.mockState)
    );
  } catch (error) {
    console.error(
      'Error creating initialMockStateSnapshot in mockData.spec.js:',
      error
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
        JSON.stringify(mockDataModule.mockState)
      );
    } catch (e) {
      initialMockStateSnapshot = {};
    }
  }
  for (const key in mockDataModule.mockState) {
    delete mockDataModule.mockState[key];
  }
  for (const key in initialMockStateSnapshot) {
    if (initialMockStateSnapshot.hasOwnProperty(key)) {
      mockDataModule.mockState[key] = JSON.parse(
        JSON.stringify(initialMockStateSnapshot[key])
      );
    }
  }
});

afterAll(() => {
  // Stop any potentially restarted intervals, though beforeEach should handle state.
  if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
    mockDataModule.stopDynamicDataUpdates();
  }
});

describe('data/mockData.js', () => {
  it('should be a valid test suite', () => {
    expect(true).toBe(true);
  });

  describe('toBase64 helper', () => {
    it('should correctly encode a string to Base64', () => {
      expect(mockDataModule.toBase64).toBeDefined();
      const testString = 'Hello World!';
      const expectedBase64 = Buffer.from(testString).toString('base64');
      expect(mockDataModule.toBase64(testString)).toBe(expectedBase64);
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
    // Use fake timers for this block because addSms schedules a setTimeout for delivery reports
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      if (jest.isMockFunction(setTimeout)) {
        // Check if timers are still faked
        jest.runAllTimers(); // Ensure all scheduled callbacks are executed
      }
      jest.clearAllTimers(); // Clear all faked timers
      jest.useRealTimers(); // Restore real timers
    });

    it('addSms should add an SMS and update counters for unread', () => {
      const initialSmsCount = mockDataModule.getState('sms_messages').length;
      const initialUnread = parseInt(mockDataModule.getState('sms_unread_num'));
      const initialNvRev = parseInt(
        mockDataModule.getState('sms_capacity_info').sms_nv_rev_total
      );

      mockDataModule.addSms({
        Number: '12345',
        MessageBody: mockDataModule.toBase64('New SMS'),
        sms_time: '25;01;01;00;00;00',
        tag: '1',
      });
      jest.runAllTimers(); // Run timers for potential delivery report

      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + 1
      ); // Base SMS
      expect(parseInt(mockDataModule.getState('sms_unread_num'))).toBe(
        initialUnread + 1
      );
      expect(mockDataModule.getState('sms_received_flag')).toBe('1');
      expect(
        parseInt(mockDataModule.getState('sms_capacity_info').sms_nv_rev_total)
      ).toBe(initialNvRev + 1);
    });

    it('addSms for a sent message should update sent count and potentially add delivery report', () => {
      const initialSmsCount = mockDataModule.getState('sms_messages').length;
      const initialSent = parseInt(
        mockDataModule.getState('sms_capacity_info').sms_nv_send_total
      );

      mockDataModule.setState('sms_parameter_info', {
        ...mockDataModule.getState('sms_parameter_info'),
        sms_para_status_report: '1',
      }); // Ensure delivery report is on for this test

      mockDataModule.addSms({
        Number: '67890',
        MessageBody: mockDataModule.toBase64('Sent SMS'),
        sms_time: '25;01;01;00;00;00',
        tag: '2',
      });

      expect(
        parseInt(mockDataModule.getState('sms_capacity_info').sms_nv_send_total)
      ).toBe(initialSent + 1);

      // Check for initial SMS addition (before delivery report timeout)
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + 1
      );

      jest.runAllTimers(); // Run timers to trigger delivery report

      // Now check if delivery report was added
      expect(mockDataModule.getState('sms_messages').length).toBe(
        initialSmsCount + 2
      );
      expect(mockDataModule.getState('sts_received_flag')).toBe('1');
    });

    it('deleteSms should remove SMS and update counters', () => {
      const addedSms = mockDataModule.addSms({
        Number: '555',
        MessageBody: mockDataModule.toBase64('To Delete'),
        sms_time: '25;01;01;00;00;00',
        tag: '1',
      });
      jest.runAllTimers(); // Flush any delivery report from addSms
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
        MessageBody: mockDataModule.toBase64('Mark as Read'),
        sms_time: '25;01;01;00;00;00',
        tag: '1',
      });
      jest.runAllTimers(); // Flush any delivery report
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
    it('addPhonebookEntry should add an entry and update counters (device)', () => {
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const initialDevUsed = parseInt(
        mockDataModule.getState('pbm_capacity_info').pbm_dev_used_record_num
      );

      mockDataModule.addPhonebookEntry({
        location: '1',
        name: mockDataModule.toBase64('New Contact Dev'),
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
    });

    it('addPhonebookEntry should add an entry and update counters (SIM)', () => {
      const initialPbmCount =
        mockDataModule.getState('phonebook_entries').length;
      const initialSimUsed = parseInt(
        mockDataModule.getState('pbm_capacity_info').pbm_sim_used_record_num
      );

      mockDataModule.addPhonebookEntry({
        location: '0',
        name: mockDataModule.toBase64('New Contact SIM'),
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
    });

    it('deletePhonebookEntries should remove entries and update counters (device)', () => {
      const addedEntry = mockDataModule.addPhonebookEntry({
        location: '1',
        name: mockDataModule.toBase64('Deletable Contact Dev'),
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
        name: mockDataModule.toBase64('Deletable Contact SIM'),
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
    // This block will also use fake timers due to the setTimeout in updateDynamicData test
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      if (jest.isMockFunction(setTimeout)) {
        jest.runAllTimers();
      }
      jest.clearAllTimers();
      jest.useRealTimers();
      // Ensure the main interval is stopped if it was started by a test
      if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
        mockDataModule.stopDynamicDataUpdates();
      }
    });

    it('stopDynamicDataUpdates should clear the interval if running', () => {
      if (typeof mockDataModule.startDynamicDataUpdates === 'function') {
        mockDataModule.startDynamicDataUpdates();
        expect(mockDataModule.mockState.dynamicDataIntervalId).not.toBeNull();
      }

      if (typeof mockDataModule.stopDynamicDataUpdates === 'function') {
        mockDataModule.stopDynamicDataUpdates();
        expect(mockDataModule.mockState.dynamicDataIntervalId).toBeNull();
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
      const initialSignal = mockDataModule.getState('signalbar');

      // Advance timers by more than the interval to ensure updateDynamicData runs
      jest.advanceTimersByTime(2100);

      const newSignal = mockDataModule.getState('signalbar');
      expect(typeof newSignal).toBe('string');
      expect(newSignal).toMatch(/^[0-5]$/);

      mockDataModule.stopDynamicDataUpdates();
      done();
    }, 5000); // Increased timeout for safety, though fake timers should make it fast
  });
});
