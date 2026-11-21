# Test Cases

**Test accounts**
- Admin: admin@test.com / password123
- User: john@test.com / password123

**App address:** http://localhost:3000 (To be changed later)

---

## Logging in

### Test 1: Log in with correct details
1. Open the app
2. Enter john@test.com and password123
3. Click Login

**Expected result:** You reach the task page

### Test 2: Log in with a wrong password
1. Open the app
2. Enter john@test.com and a wrong password
3. Click Login

**Expected result:** Error message, you are not logged in

---

## Adding tasks

### Test 3: Add a task
1. Log in as john@test.com
2. Click "Add Task"
3. Type "Buy milk" and save

**Expected result:** "Buy milk" appears in the task list

---

## Deleting tasks

### Test 4: Delete a task
1. Log in as john@test.com
2. Click delete on any task

**Expected result:** The task is removed from the list

---

## Filtering tasks

### Test 5: Filter tasks by status
1. Log in as john@test.com
2. Make sure you have tasks with different statuses (pending, in-progress, completed)
3. Choose a status in the filter, for example "Completed"

**Expected result:** Only tasks with that status are shown

---

## Role access

### Test 6: Normal user cannot open the admin page
1. Log in as john@test.com
2. In the address bar, type localhost:3000/admin and press Enter

**Expected result:** Access denied

### Test 7: Admin can open the admin page
1. Log in as admin@test.com
2. In the address bar, type localhost:3000/admin and press Enter

**Expected result:** The admin page opens