# Firebase Security Rules - NEU Attendance

## Current Status: AUDIT REQUIRED

The current Firebase Realtime Database rules need to be reviewed and updated. This document provides recommended security rules and rationale.

## Recommended Rules

```json
{
  "rules": {
    // Active session pointer - anyone can read, but only authenticated admin could write (simplified for demo)
    "activeSession": {
      ".read": true,
      ".write": true
    },

    // Sessions - instructors create, everyone reads (to verify codes)
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['id', 'className', 'location', 'radius', 'code', 'codeGeneratedAt', 'createdAt'])",

        "className": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        "radius": {
          ".validate": "newData.isNumber() && newData.val() >= 20 && newData.val() <= 200"
        },
        "code": {
          ".validate": "newData.isString() && newData.val().length == 6"
        },
        "location": {
          ".validate": "newData.hasChildren(['lat', 'lng'])"
        }
      }
    },

    // Attendance records - students create their own, instructors read all
    "attendance": {
      "$sessionId": {
        ".read": true,
        "$recordId": {
          ".write": true,
          ".validate": "newData.hasChildren(['studentId', 'studentName', 'email', 'deviceId', 'location', 'distance', 'timestamp', 'manuallyApproved'])",

          "studentId": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 20"
          },
          "studentName": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
          },
          "email": {
            ".validate": "newData.isString() && newData.val().contains('@')"
          },
          "distance": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          }
        }
      }
    },

    // Failed attempts - students create, instructors read/delete
    "failed": {
      "$sessionId": {
        ".read": true,
        "$recordId": {
          ".write": true,
          ".validate": "newData.hasChildren(['studentId', 'studentName', 'email', 'deviceId', 'location', 'distance', 'reason', 'allowedRadius', 'timestamp'])"
        }
      }
    },

    // Deny all other access
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

## Security Considerations

### Current Implementation (Demo Mode)

The current implementation allows open read/write access which is suitable for:
- Classroom demonstrations
- Testing and development
- Trusted environments (university network)

### Known Limitations

1. **No Authentication**: Anyone with the URL can act as an instructor
2. **No Authorization**: Students could potentially write to attendance directly
3. **Data Validation**: Basic validation only, not cryptographically secure
4. **Rate Limiting**: Not enforced at database level (only client-side)

### Recommended Improvements for Production

#### Phase 1: Basic Validation (Low Effort)

Deploy the rules above to enforce:
- Data structure validation
- Field length limits
- Type checking

#### Phase 2: Authentication (Medium Effort)

Add Firebase Authentication:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null && auth.token.role == 'instructor'"
      }
    },
    "attendance": {
      "$sessionId": {
        ".read": "auth != null",
        "$recordId": {
          ".write": "auth != null && !data.exists()"
        }
      }
    }
  }
}
```

#### Phase 3: Full Security (High Effort)

For production deployment:
1. Require instructor authentication (university SSO)
2. Validate student identity against university directory
3. Add rate limiting via Cloud Functions
4. Implement audit logging
5. Add data encryption for PII

## Applying Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `neu-attendance` project
3. Navigate to Realtime Database > Rules
4. Replace existing rules with recommended rules
5. Click "Publish"

## Testing Rules

Use the Firebase Rules Playground to test:

1. Test that valid attendance records can be written
2. Test that invalid data (too long, wrong type) is rejected
3. Test that reading sessions works for everyone
4. Test that other paths are denied

## Monitoring

Enable Firebase Realtime Database auditing to monitor:
- Failed write attempts
- Unusual access patterns
- Data volume anomalies

---

**Last Updated:** 2026-01-13
**Status:** Documentation complete, rules pending deployment
