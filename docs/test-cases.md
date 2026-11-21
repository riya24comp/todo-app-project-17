# Test Cases

**Test accounts**
- Admin: admin@test.com / password123
- User: john@test.com / password123

**App address:** http://localhost:3000 (To be changed later)

| Test ID | Feature | Steps | Expected Result | Actual Result | Status |
|---------|---------|-------|-----------------|---------------|--------|
| TC-01 | Login | 1. Open the app<br>2. Enter john@test.com and password123<br>3. Click Login | You reach the task page | | Not run |
| TC-02 | Login | 1. Open the app<br>2. Enter john@test.com and a wrong password<br>3. Click Login | Error message, you are not logged in | | Not run |
| TC-03 | Add Task | 1. Log in as john@test.com<br>2. Click "Add Task"<br>3. Type "Buy milk" and save | "Buy milk" appears in the task list | | Not run |
| TC-04 | Delete Task | 1. Log in as john@test.com<br>2. Click delete on any task | The task is removed from the list | | Not run |
| TC-05 | Filter Tasks | 1. Log in as john@test.com<br>2. Make sure you have tasks with different statuses (pending, in-progress, completed)<br>3. Choose a status in the filter, for example "Completed" | Only tasks with that status are shown | | Not run |
| TC-06 | Role Access | 1. Log in as john@test.com<br>2. In the address bar, type localhost:3000/admin and press Enter | Access denied | | Not run |
| TC-07 | Role Access | 1. Log in as admin@test.com<br>2. In the address bar, type localhost:3000/admin and press Enter | The admin page opens | | Not run |