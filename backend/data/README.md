# Database Structure

This directory contains the modular database files for the RBAC system. The data has been split into separate files for better organization and maintainability.

## File Structure

### 📁 `users.json`

Contains all user/employee data including:

- Personal information (name, email, phone)
- Professional details (employee ID, department, designation)
- Role assignments
- Account status and timestamps

**Example:**

```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@bcpl.com",
    "phone": "+91-9876543210",
    "employeeId": "EMP001",
    "department": "IT",
    "designation": "System Administrator",
    "roles": ["admin"],
    "isActive": true,
    "joinDate": "2020-01-15",
    "lastLogin": "2025-01-28T10:30:00.000Z"
  }
]
```

### 📁 `forms.json`

Contains form definitions and field configurations:

- Form metadata (name, type)
- Field definitions with validation rules
- Table structure for dynamic forms

**Example:**

```json
{
  "F-PRODUCTION-PLAN-ENTRY": {
    "name": "Production Plan Entry",
    "type": "table",
    "fields": [...],
    "tableFields": [...]
  }
}
```

### 📁 `processes.json`

Contains workflow processes and task definitions:

- Process metadata
- Task configurations with triggers and dependencies
- Form assignments and status tracking

**Example:**

```json
[
  {
    "id": 1,
    "name": "Production Planning Workflow",
    "tasks": [
      {
        "id": 1001,
        "name": "Monthly Production Plan",
        "assignedRole": "plant_head",
        "assignedUserId": 4,
        "status": "completed",
        "dependencies": [],
        "formId": "F-PRODUCTION-PLAN-ENTRY",
        "trigger": {...},
        "formData": null,
        "lastUpdated": null
      }
    ]
  }
]
```

## Migration

### From Old Structure

If you're migrating from the old `db.json` file:

1. **Automatic Migration**: The system will automatically migrate on first startup
2. **Manual Migration**: Run the migration script:
   ```bash
   node migrate-to-modular.js
   ```

### Benefits of Modular Structure

✅ **Better Organization**: Each data type is in its own file
✅ **Easier Maintenance**: Edit specific data without affecting others
✅ **Version Control**: Track changes to specific data types separately
✅ **Backup & Restore**: Backup/restore specific data types
✅ **Performance**: Load only needed data types
✅ **Collaboration**: Multiple developers can work on different files

## Usage

### Reading Data

```javascript
const {
  readDB,
  readUsers,
  readForms,
  readProcesses,
} = require("./utils/dbHelper");

// Read all data
const allData = await readDB();

// Read specific data types
const users = await readUsers();
const forms = await readForms();
const processes = await readProcesses();
```

### Writing Data

```javascript
const {
  writeDB,
  writeUsers,
  writeForms,
  writeProcesses,
} = require("./utils/dbHelper");

// Write all data
await writeDB(allData);

// Write specific data types
await writeUsers(users);
await writeForms(forms);
await writeProcesses(processes);
```

## File Management

### Adding New Users

Edit `users.json` directly or use the API endpoints:

- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Adding New Forms

Edit `forms.json` directly. Each form should have:

- Unique form ID (e.g., "F-NEW-FORM")
- Form metadata (name, type)
- Field definitions
- Validation rules

### Adding New Processes

Edit `processes.json` directly. Each process should have:

- Process metadata (id, name)
- Task definitions with proper dependencies
- Trigger configurations
- Form assignments

## Backup Strategy

### Individual File Backups

```bash
# Backup specific files
cp users.json users.json.backup
cp forms.json forms.json.backup
cp processes.json processes.json.backup
```

### Complete Backup

```bash
# Backup entire data directory
tar -czf data-backup-$(date +%Y%m%d).tar.gz *.json
```

## Troubleshooting

### File Corruption

If any file becomes corrupted:

1. Restore from backup
2. Or regenerate from `db.json` using migration script

### Missing Files

If modular files are missing:

1. The system will automatically migrate from `db.json`
2. Or run migration manually: `node migrate-to-modular.js`

### Performance Issues

For large datasets:

1. Consider splitting processes into separate files by workflow
2. Implement data pagination for large user lists
3. Use database indexing for frequent queries

## Notes

- The old `db.json` file is preserved as backup
- All existing API endpoints continue to work unchanged
- The modular structure is transparent to the frontend
- Automatic migration ensures backward compatibility
