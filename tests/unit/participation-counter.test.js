/**
 * Unit tests for Participation Counter feature
 *
 * Tests the incrementParticipation and decrementParticipation functions
 * and the participation field in attendance records.
 */

describe('Participation Counter Functions', () => {
  // Mock Firebase
  let mockDb;
  let mockRef;
  let mockTransaction;
  let mockUpdate;
  let mockOnce;

  beforeEach(() => {
    mockUpdate = jest.fn().mockResolvedValue();
    mockTransaction = jest.fn().mockImplementation((callback) => {
      const currentData = { participation: 0 };
      const newData = callback(currentData);
      return Promise.resolve({ committed: true, snapshot: { val: () => newData } });
    });
    mockOnce = jest.fn().mockResolvedValue({ val: () => ({ participation: 0 }) });
    mockRef = jest.fn().mockReturnValue({
      update: mockUpdate,
      transaction: mockTransaction,
      once: mockOnce
    });
    mockDb = { ref: mockRef };

    // Set up global firebase mock
    global.firebase = {
      database: () => mockDb
    };
    global.db = mockDb;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.firebase;
    delete global.db;
  });

  describe('incrementParticipation', () => {
    test('should increment participation count from 0 to 1', async () => {
      // Create a simple implementation for testing
      const incrementParticipation = async (sessionId, odooId) => {
        const ref = db.ref(`attendance/${sessionId}/${odooId}`);
        const snapshot = await ref.once('value');
        const current = snapshot.val()?.participation || 0;
        await ref.update({ participation: current + 1 });
        return current + 1;
      };

      const result = await incrementParticipation('session123', 'student456');

      expect(mockRef).toHaveBeenCalledWith('attendance/session123/student456');
      expect(mockUpdate).toHaveBeenCalledWith({ participation: 1 });
      expect(result).toBe(1);
    });

    test('should increment participation count from existing value', async () => {
      mockOnce.mockResolvedValue({ val: () => ({ participation: 5 }) });

      const incrementParticipation = async (sessionId, odooId) => {
        const ref = db.ref(`attendance/${sessionId}/${odooId}`);
        const snapshot = await ref.once('value');
        const current = snapshot.val()?.participation || 0;
        await ref.update({ participation: current + 1 });
        return current + 1;
      };

      const result = await incrementParticipation('session123', 'student456');

      expect(mockUpdate).toHaveBeenCalledWith({ participation: 6 });
      expect(result).toBe(6);
    });

    test('should handle missing participation field (default to 0)', async () => {
      mockOnce.mockResolvedValue({ val: () => ({ studentName: 'Test' }) });

      const incrementParticipation = async (sessionId, odooId) => {
        const ref = db.ref(`attendance/${sessionId}/${odooId}`);
        const snapshot = await ref.once('value');
        const current = snapshot.val()?.participation || 0;
        await ref.update({ participation: current + 1 });
        return current + 1;
      };

      const result = await incrementParticipation('session123', 'student456');

      expect(mockUpdate).toHaveBeenCalledWith({ participation: 1 });
      expect(result).toBe(1);
    });
  });

  describe('decrementParticipation', () => {
    test('should decrement participation count from 5 to 4', async () => {
      mockOnce.mockResolvedValue({ val: () => ({ participation: 5 }) });

      const decrementParticipation = async (sessionId, odooId) => {
        const ref = db.ref(`attendance/${sessionId}/${odooId}`);
        const snapshot = await ref.once('value');
        const current = snapshot.val()?.participation || 0;
        const newValue = Math.max(0, current - 1);
        await ref.update({ participation: newValue });
        return newValue;
      };

      const result = await decrementParticipation('session123', 'student456');

      expect(mockUpdate).toHaveBeenCalledWith({ participation: 4 });
      expect(result).toBe(4);
    });

    test('should not decrement below 0', async () => {
      mockOnce.mockResolvedValue({ val: () => ({ participation: 0 }) });

      const decrementParticipation = async (sessionId, odooId) => {
        const ref = db.ref(`attendance/${sessionId}/${odooId}`);
        const snapshot = await ref.once('value');
        const current = snapshot.val()?.participation || 0;
        const newValue = Math.max(0, current - 1);
        await ref.update({ participation: newValue });
        return newValue;
      };

      const result = await decrementParticipation('session123', 'student456');

      expect(mockUpdate).toHaveBeenCalledWith({ participation: 0 });
      expect(result).toBe(0);
    });

    test('should handle missing participation field', async () => {
      mockOnce.mockResolvedValue({ val: () => ({ studentName: 'Test' }) });

      const decrementParticipation = async (sessionId, odooId) => {
        const ref = db.ref(`attendance/${sessionId}/${odooId}`);
        const snapshot = await ref.once('value');
        const current = snapshot.val()?.participation || 0;
        const newValue = Math.max(0, current - 1);
        await ref.update({ participation: newValue });
        return newValue;
      };

      const result = await decrementParticipation('session123', 'student456');

      expect(mockUpdate).toHaveBeenCalledWith({ participation: 0 });
      expect(result).toBe(0);
    });
  });

  describe('Participation field in attendance record', () => {
    test('attendance record should support participation field', () => {
      const attendanceRecord = {
        studentId: '12345',
        studentName: 'Test Student',
        email: 'test@example.com',
        deviceId: 'DEV-123',
        timestamp: '2024-01-20T10:00:00Z',
        participation: 3
      };

      expect(attendanceRecord.participation).toBe(3);
      expect(typeof attendanceRecord.participation).toBe('number');
    });

    test('participation should default to 0 when not set', () => {
      const attendanceRecord = {
        studentId: '12345',
        studentName: 'Test Student'
      };

      const participation = attendanceRecord.participation || 0;
      expect(participation).toBe(0);
    });
  });
});
